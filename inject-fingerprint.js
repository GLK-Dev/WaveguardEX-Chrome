// Inject Anti-Fingerprinting Module into the main page context

let isAntiTrackingEnabled = true;

chrome.storage.local.get(['antiTracking'], (result) => {
  if (result.antiTracking !== undefined) {
    isAntiTrackingEnabled = result.antiTracking;
  }
  
  if (isAntiTrackingEnabled) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('anti-fingerprint.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }
});
