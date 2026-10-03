// Bridge between the MAIN-world page-guard.js and extension APIs.
// MAIN-world scripts have no access to chrome.* APIs, so this isolated-world
// script relays settings in and blocked-threat events out via window events.
(function() {
  function sendConfig() {
    chrome.storage.sync.get(['securityProtection', 'antiTracking'], (result) => {
      window.dispatchEvent(new CustomEvent('waveguard-config', {
        detail: {
          securityProtection: result.securityProtection !== false,
          antiTracking: result.antiTracking !== false
        }
      }));
    });
  }

  sendConfig();
  // MAIN-world listeners may register after the first dispatch; repeat once the DOM is ready.
  document.addEventListener('DOMContentLoaded', sendConfig, { once: true });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.securityProtection || changes.antiTracking)) {
      sendConfig();
    }
  });

  window.addEventListener('waveguard-threat', (e) => {
    const threat = e && e.detail && e.detail.threat;
    if (!threat) return;
    try {
      chrome.runtime.sendMessage({ action: 'threatBlocked', threat });
    } catch (err) {
      // Extension context invalidated (e.g. after an update reload)
    }
  });
})();
