// Background service worker. All state lives in chrome.storage / declarativeNetRequest:
// the worker can be stopped at any moment, so nothing important may sit in globals.

const DEFAULT_SETTINGS = {
  adBlockEnabled: true,
  youtubeAdBlockEnabled: true,
  tiktokAdBlockEnabled: true,
  facebookAdBlockEnabled: true,
  strictMode: false,
  antiTracking: true,
  blockAnalytics: true,
  securityProtection: true,
  language: 'ru'
};

// Setting -> static ruleset (ids from manifest.json).
const SETTING_RULESETS = {
  adBlockEnabled: 'ads',
  blockAnalytics: 'trackers',
  securityProtection: 'miners',
  antiTracking: 'tracking_params'
};

const WARNING_URL = chrome.runtime.getURL('warning.html');

async function getSettings() {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS, ...stored };
}

// --- Counters (serialized read-modify-write so concurrent messages don't lose increments) ---
let counterQueue = Promise.resolve();

function bumpCounter(key, by = 1) {
  const next = counterQueue.then(async () => {
    const data = await chrome.storage.local.get(key);
    const value = (data[key] || 0) + by;
    await chrome.storage.local.set({ [key]: value });
    return value;
  });
  counterQueue = next.catch(() => {});
  return next;
}

// --- Static rulesets follow the user's toggles ---
async function syncRulesets(settings) {
  const enableRulesetIds = [];
  const disableRulesetIds = [];
  for (const [setting, rulesetId] of Object.entries(SETTING_RULESETS)) {
    (settings[setting] ? enableRulesetIds : disableRulesetIds).push(rulesetId);
  }
  await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds, disableRulesetIds });
}

// --- Threat database -> dynamic redirect rules to the warning page (blocks before the page loads) ---
const DOMAIN_CATEGORIES = {
  phishing: 'phishing',
  malware: 'malware',
  cryptojacking: 'cryptojacking',
  pup_domains: 'pup'
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function redirectToWarning(threat) {
  // \0 is the whole match, so every regexFilter below must match the entire URL.
  return { type: 'redirect', redirect: { regexSubstitution: `${WARNING_URL}?t=${threat}&u=\\0` } };
}

async function buildThreatRules() {
  const db = await (await fetch(chrome.runtime.getURL('malicious-domains.json'))).json();
  const rules = [];
  let id = 1;

  for (const [category, threat] of Object.entries(DOMAIN_CATEGORIES)) {
    // "*.example.com" -> example.com (requestDomains already covers subdomains); other wildcards are skipped.
    const domains = [...new Set(
      (db[category] || [])
        .map((p) => p.toLowerCase().replace(/^\*\./, ''))
        .filter((d) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d))
    )];
    if (domains.length === 0) continue;
    rules.push({
      id: id++,
      priority: 2,
      action: redirectToWarning(threat),
      condition: { regexFilter: '^https?://.*', requestDomains: domains, resourceTypes: ['main_frame'] }
    });
  }

  const regexRules = [];
  const tlds = (db.suspicious_tlds || [])
    .map((t) => t.toLowerCase().replace(/^\./, ''))
    .filter((t) => /^[a-z0-9-]+$/.test(t));
  if (tlds.length) {
    regexRules.push({ threat: 'suspicious', regex: `^https?://[^/?#]*\\.(${tlds.join('|')})([:/?#]|$).*` });
  }
  const keywords = (db.scam_keywords || []).filter(Boolean).map((k) => escapeRegex(k.toLowerCase()));
  if (keywords.length) {
    // Host and path only: a keyword in a search query must not trigger the warning.
    regexRules.push({ threat: 'scam', regex: `^https?://[^?#]*(${keywords.join('|')}).*` });
  }

  for (const { threat, regex } of regexRules) {
    const { isSupported } = await chrome.declarativeNetRequest.isRegexSupported({ regex, isCaseSensitive: false });
    if (!isSupported) continue;
    rules.push({
      id: id++,
      priority: 2,
      action: redirectToWarning(threat),
      condition: { regexFilter: regex, isUrlFilterCaseSensitive: false, resourceTypes: ['main_frame'] }
    });
  }

  return rules;
}

async function rebuildThreatRules(enabled) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const addRules = enabled ? await buildThreatRules() : [];
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules
  });
}

// "Proceed anyway" on the warning page: a session allow rule outranks the redirect rules (priority 2).
function hostRuleId(host) {
  let h = 0;
  for (const ch of host) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return (Math.abs(h) % 2000000000) + 1;
}

async function allowDomain(host) {
  const id = hostRuleId(host);
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [id],
    addRules: [{
      id,
      priority: 3,
      action: { type: 'allow' },
      condition: { requestDomains: [host], resourceTypes: ['main_frame'] }
    }]
  });
}

// --- Lifecycle ---
chrome.runtime.onInstalled.addListener(async () => {
  // Fill in only missing keys so an update never overwrites the user's choices.
  const stored = await chrome.storage.sync.get(null);
  const missing = {};
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (stored[key] === undefined) missing[key] = value;
  }
  if (Object.keys(missing).length) await chrome.storage.sync.set(missing);

  // Updates reset enabled static rulesets to the manifest defaults, so re-apply the user's choices.
  const settings = await getSettings();
  await syncRulesets(settings);
  await rebuildThreatRules(settings.securityProtection);
});

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace !== 'sync') return;
  try {
    if (Object.keys(SETTING_RULESETS).some((key) => changes[key])) {
      await syncRulesets(await getSettings());
    }
    if (changes.securityProtection) {
      await rebuildThreatRules(changes.securityProtection.newValue !== false);
    }
  } catch (e) {
    console.error('[Waveguard] Не удалось применить настройки:', e);
  }
});

// --- Messages ---
const HOST_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;

async function handleMessage(message, sender) {
  switch (message.action) {
    case 'adBlocked': {
      const settings = await getSettings();
      if (!settings.adBlockEnabled) return { success: false };
      const by = Math.min(Math.max(parseInt(message.count, 10) || 1, 1), 1000);
      return { success: true, count: await bumpCounter('blockedAdsCount', by) };
    }
    case 'threatBlocked': {
      const settings = await getSettings();
      if (!settings.securityProtection) return { success: false };
      return { success: true, threatsCount: await bumpCounter('blockedThreatsCount') };
    }
    case 'getBlockedCount': {
      const data = await chrome.storage.local.get(['blockedAdsCount', 'blockedThreatsCount']);
      return { count: data.blockedAdsCount || 0, threatsCount: data.blockedThreatsCount || 0 };
    }
    case 'resetBlockedCount':
      await chrome.storage.local.set({ blockedAdsCount: 0, blockedThreatsCount: 0 });
      return { success: true, count: 0, threatsCount: 0 };
    case 'getSettings':
      return { settings: await getSettings() };
    case 'getDesktopStatus':
      return { connected: !!desktopSocket && desktopSocket.readyState === WebSocket.OPEN };
    case 'allowDomain': {
      // Only the warning page itself may whitelist a host.
      const host = String(message.host || '').toLowerCase();
      if (!sender.url || !sender.url.startsWith(WARNING_URL) || !HOST_RE.test(host)) return { success: false };
      await allowDomain(host);
      return { success: true };
    }
  }

  if (message.type === 'SCAN_FILE_HASH' || message.type === 'DOM_THREAT_REPORT') {
    if (desktopSocket && desktopSocket.readyState === WebSocket.OPEN) {
      desktopSocket.send(JSON.stringify({
        type: message.type,
        data: message.payload,
        tabId: sender.tab ? sender.tab.id : null
      }));
      return { status: 'sent_to_desktop' };
    }
    return { status: 'desktop_disconnected' };
  }
  return undefined;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((e) => sendResponse({ success: false, error: String(e) }));
  return true;
});

// --- Waveguard Desktop integration (WebSocket) ---
let desktopSocket = null;

function connectToDesktop() {
  if (desktopSocket && (desktopSocket.readyState === WebSocket.OPEN || desktopSocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const socket = new WebSocket('ws://127.0.0.1:18765');
  desktopSocket = socket;

  socket.onopen = () => console.log('[Waveguard] Подключено к WaveguardDesktop');
  socket.onmessage = (event) => console.log('[Waveguard] Сообщение от Desktop:', event.data);
  socket.onclose = () => {
    if (desktopSocket === socket) desktopSocket = null;
  };
  socket.onerror = () => {};
}

// Alarms (min period 30s) survive worker shutdown, unlike setTimeout.
chrome.alarms.create('desktop-reconnect', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'desktop-reconnect') connectToDesktop();
});

connectToDesktop();
