// Page Guard - runs in the MAIN world (real page context) so overrides actually
// intercept the page's own calls, unlike isolated-world content scripts.
(function() {
  if (window.__waveguardPageGuard) return;
  window.__waveguardPageGuard = true;

  // Enabled by default; page-guard-bridge.js (isolated world) syncs real settings.
  let securityEnabled = true;

  window.addEventListener('waveguard-config', (e) => {
    const cfg = (e && e.detail) || {};
    if (typeof cfg.securityProtection === 'boolean') {
      securityEnabled = cfg.securityProtection;
    }
  });

  function reportThreat(threat) {
    window.dispatchEvent(new CustomEvent('waveguard-threat', { detail: { threat } }));
  }

  // --- Aggressive popup blocking ---
  let popupAttempts = 0;
  const maxPopups = 2;
  const originalOpen = window.open;
  window.open = function(...args) {
    if (securityEnabled) {
      popupAttempts++;
      if (popupAttempts > maxPopups) {
        reportThreat('popup');
        return null;
      }
    }
    return originalOpen.apply(this, args);
  };
  setInterval(() => { popupAttempts = 0; }, 5000);

  // --- Cryptojacking blocking ---
  const cryptoMinerPatterns = [
    'coinhive', 'coin-hive', 'jsecoin', 'crypto-loot',
    'cryptoloot', 'webminepool', 'monerominer', 'minero'
  ];

  const OriginalWorker = window.Worker;
  window.Worker = function(scriptURL, options) {
    if (securityEnabled) {
      const url = String(scriptURL).toLowerCase();
      if (cryptoMinerPatterns.some(pattern => url.includes(pattern))) {
        reportThreat('cryptojacking');
        throw new Error('Blocked by Waveguard Security');
      }
    }
    return new OriginalWorker(scriptURL, options);
  };
  window.Worker.prototype = OriginalWorker.prototype;

  ['CoinHive', 'CRLT', 'JSEcoin'].forEach(objName => {
    try {
      Object.defineProperty(window, objName, {
        get() {
          if (securityEnabled) reportThreat('cryptojacking');
          return undefined;
        },
        set() { return false; },
        configurable: true
      });
    } catch (e) {
      // Already defined/protected by the page or another extension
    }
  });

  // --- Ad iframe creation blocking ---
  const adIframePatterns = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    '/ads/', 'advertising.com', 'adnxs.com', 'criteo.com', 'taboola.com'
  ];

  const originalCreateElement = Document.prototype.createElement;
  Document.prototype.createElement = function(tagName, options) {
    const element = originalCreateElement.call(this, tagName, options);

    if (typeof tagName === 'string' && tagName.toLowerCase() === 'iframe') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (securityEnabled && name === 'src' && typeof value === 'string' &&
            adIframePatterns.some(pattern => value.includes(pattern))) {
          reportThreat('ad_iframe');
          return;
        }
        return originalSetAttribute.call(element, name, value);
      };
    }

    return element;
  };
})();
