const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const manifest = read('manifest.json');

test('every file referenced by the manifest exists', () => {
  const files = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...manifest.content_scripts.flatMap((cs) => [...(cs.js || []), ...(cs.css || [])]),
    ...manifest.web_accessible_resources.flatMap((w) => w.resources),
    ...manifest.declarative_net_request.rule_resources.map((r) => r.path)
  ];
  for (const f of files) assert.ok(fs.existsSync(path.join(root, f)), `missing: ${f}`);
});

test('rulesets: unique ids, anchored urlFilters, valid actions', () => {
  const ids = manifest.declarative_net_request.rule_resources.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const { path: rulesPath } of manifest.declarative_net_request.rule_resources) {
    const rules = read(rulesPath);
    const seen = new Set();
    for (const rule of rules) {
      assert.ok(!seen.has(rule.id), `${rulesPath}: duplicate id ${rule.id}`);
      seen.add(rule.id);
      assert.ok(['block', 'redirect', 'allow'].includes(rule.action.type), `${rulesPath}#${rule.id}`);
      if (rule.action.type === 'block') {
        // Unanchored substring filters were the source of false positives (e.g. "*googletag*").
        assert.match(rule.condition.urlFilter, /^\|\|[a-z0-9.-]+[/^]/, `${rulesPath}#${rule.id}: ${rule.condition.urlFilter}`);
      }
    }
  }
});

test('settings drive rulesets that exist in the manifest', () => {
  const background = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
  const ids = new Set(manifest.declarative_net_request.rule_resources.map((r) => r.id));
  const block = /SETTING_RULESETS = \{([^}]*)\}/.exec(background)[1];
  for (const [, id] of block.matchAll(/:\s*'([a-z_]+)'/g)) assert.ok(ids.has(id), `unknown ruleset ${id}`);
});

test('malicious-domains.json has the categories background.js reads', () => {
  const db = read('malicious-domains.json');
  for (const key of ['phishing', 'malware', 'cryptojacking', 'pup_domains', 'suspicious_tlds', 'scam_keywords']) {
    assert.ok(Array.isArray(db[key]), key);
  }
});

test('manifest keeps permissions minimal', () => {
  assert.deepEqual([...manifest.permissions].sort(), ['alarms', 'declarativeNetRequest', 'storage']);
  assert.deepEqual(manifest.web_accessible_resources.flatMap((w) => w.resources), ['warning.html']);
});
