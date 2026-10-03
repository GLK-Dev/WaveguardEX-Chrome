// Browser smoke test: loads the unpacked extension into Playwright's Chromium and checks the
// behaviours unit tests cannot reach (DNR rules, warning interstitial, DLP, cookie of storage).
// Run: npx playwright install chromium && npm run e2e
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionPath = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const db = JSON.parse(readFileSync(join(extensionPath, 'malicious-domains.json'), 'utf8'));

const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'wg-e2e-')), {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    failures++;
    console.log(`FAIL  ${name}\n      ${e.message.split('\n')[0]}`);
  }
}

try {
  const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker', { timeout: 15000 }));
  const extId = new URL(worker.url()).host;
  // onInstalled (default settings + dynamic rules) runs asynchronously after the worker starts.
  await worker.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

  await check('static rulesets are enabled', async () => {
    const enabled = await worker.evaluate(() => chrome.declarativeNetRequest.getEnabledRulesets());
    assert.deepEqual([...enabled].sort(), ['ads', 'miners', 'trackers', 'tracking_params'], JSON.stringify(enabled));
  });

  await check('threat redirect rules were built from the database', async () => {
    const rules = await worker.evaluate(() => chrome.declarativeNetRequest.getDynamicRules());
    assert.ok(rules.length >= 3, `only ${rules.length} dynamic rules`);
  });

  const page = await context.newPage();

  await check('malware host redirects to warning page with original URL', async () => {
    const host = db.malware[0];
    await page.goto(`http://${host}/some/path?x=1`).catch(() => {});
    await page.waitForURL(new RegExp(`^chrome-extension://${extId}/warning\\.html`), { timeout: 10000 });
    assert.match(page.url(), /t=malware/);
    assert.ok(page.url().includes(`u=http://${host}/some/path?x=1`), page.url());
    assert.match(await page.textContent('#message'), /вредоносн/i);
    assert.ok((await page.textContent('#url')).includes(host));
  });

  await check('phishing host redirects too', async () => {
    await page.goto(`http://${db.phishing[0]}/`).catch(() => {});
    await page.waitForURL(/warning\.html\?t=phishing/, { timeout: 10000 });
  });

  await check('threat counter was incremented by the warning page', async () => {
    const count = await worker.evaluate(async () => (await chrome.storage.local.get('blockedThreatsCount')).blockedThreatsCount);
    assert.ok(count >= 1, `count=${count}`);
  });

  await check('"proceed" whitelists the host for the session instead of looping back to the warning', async () => {
    const host = db.malware[1];
    await page.goto(`http://${host}/`).catch(() => {});
    await page.waitForURL(/warning\.html\?t=malware/, { timeout: 10000 });
    await page.click('#proceed');
    // The host does not resolve, so the browser ends on an error page, not the interstitial.
    await page.waitForTimeout(2000);
    assert.ok(!page.url().includes('warning.html'), page.url());
    const sessionRules = await worker.evaluate(() => chrome.declarativeNetRequest.getSessionRules());
    assert.ok(sessionRules.some((r) => r.condition.requestDomains?.includes(host)));
  });

  await check('tracking parameters are stripped from navigations', async () => {
    const p = await context.newPage();
    await p.goto('https://example.com/?utm_source=a&keep=1&fbclid=zzz');
    const url = new URL(p.url());
    assert.equal(url.searchParams.has('utm_source'), false, p.url());
    assert.equal(url.searchParams.has('fbclid'), false, p.url());
    assert.equal(url.searchParams.get('keep'), '1');
  });

  await check('ad network requests are blocked', async () => {
    const p = await context.newPage();
    await p.goto('https://example.com/');
    const outcome = await p.evaluate(() => fetch('https://doubleclick.net/pagead/x', { mode: 'no-cors' }).then(() => 'loaded', () => 'blocked'));
    assert.equal(outcome, 'blocked');
  });

  await check('forged threat events from a page cannot inflate the counter', async () => {
    const p = await context.newPage();
    await p.goto('https://example.com/');
    const read = () => worker.evaluate(async () => (await chrome.storage.local.get('blockedThreatsCount')).blockedThreatsCount || 0);
    const emit = (threat, times) => p.evaluate(({ threat, times }) => {
      for (let i = 0; i < times; i++) window.dispatchEvent(new CustomEvent('waveguard-threat', { detail: { threat } }));
    }, { threat, times });
    const settle = () => p.waitForTimeout(500);

    const before = await read();
    await emit('not_a_real_threat', 5);
    await settle();
    assert.equal(await read(), before, 'unknown threat type was counted');

    await emit('scam', 30);
    await settle();
    assert.equal(await read(), before + 1, 'burst of 30 should count once');
  });

  await check('threat rules are rebuilt when they are missing', async () => {
    const count = await worker.evaluate(async () => {
      const dnr = chrome.declarativeNetRequest;
      await dnr.updateDynamicRules({ removeRuleIds: (await dnr.getDynamicRules()).map((r) => r.id) });
      const emptied = (await dnr.getDynamicRules()).length;
      if (emptied !== 0) return -1;
      await ensureThreatRules();
      return (await dnr.getDynamicRules()).length;
    });
    assert.ok(count >= 3, `rules after recovery: ${count}`);
  });

  await check('turning ad blocking off disables the ads ruleset', async () => {
    await worker.evaluate(() => chrome.storage.sync.set({ adBlockEnabled: false }));
    await worker.evaluate(() => new Promise((r) => setTimeout(r, 500)));
    const enabled = await worker.evaluate(() => chrome.declarativeNetRequest.getEnabledRulesets());
    assert.ok(!enabled.includes('ads'));
    await worker.evaluate(() => chrome.storage.sync.set({ adBlockEnabled: true }));
    await worker.evaluate(() => new Promise((r) => setTimeout(r, 500)));
  });

  // DLP matches chatgpt.com only, so serve a stand-in page for that origin.
  await context.route('https://chatgpt.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><textarea id="t"></textarea><div id="ce" contenteditable="true"></div>'
    })
  );
  const chat = await context.newPage();
  await chat.goto('https://chatgpt.com/');

  await check('DLP masks a typed card number in a textarea', async () => {
    await chat.click('#t');
    await chat.keyboard.type('my card 4111 1111 1111 1111 thanks', { delay: 10 });
    const value = await chat.inputValue('#t');
    assert.ok(!/4111 1111 1111 1111/.test(value), value);
    assert.ok(value.includes('[MASKED SENSITIVE DATA]'), value);
  });

  await check('DLP masks pasted text before insertion', async () => {
    await chat.fill('#t', '');
    await chat.click('#t');
    await chat.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/plain', 'write to john.doe@example.com');
      document.getElementById('t').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    const value = await chat.inputValue('#t');
    assert.ok(!value.includes('john.doe@example.com'), value);
    assert.ok(value.includes('[MASKED SENSITIVE DATA]'), value);
  });

  await check('DLP leaves a non-Luhn number alone', async () => {
    await chat.fill('#t', '');
    await chat.click('#t');
    await chat.keyboard.type('ticket 4111111111111112', { delay: 5 });
    assert.equal(await chat.inputValue('#t'), 'ticket 4111111111111112', await chat.inputValue('#t'));
  });

  await check('DLP masks a card that is the last thing typed once Enter is pressed', async () => {
    await chat.fill('#t', '');
    await chat.click('#t');
    await chat.keyboard.type('4111111111111111', { delay: 5 });
    await chat.keyboard.press('Enter');
    const value = await chat.inputValue('#t');
    assert.ok(!value.includes('4111111111111111'), value);
  });

  await check('DLP masks text typed into a contenteditable', async () => {
    await chat.click('#ce');
    await chat.keyboard.type('mail me: a.b@example.com', { delay: 10 });
    await chat.keyboard.press('Enter');
    const text = await chat.textContent('#ce');
    assert.ok(!text.includes('a.b@example.com'), text);
  });
} finally {
  await context.close();
}

console.log(failures === 0 ? '\nAll E2E checks passed' : `\n${failures} E2E check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
