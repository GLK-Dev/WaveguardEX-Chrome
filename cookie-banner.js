// Auto-Reject Cookie Banners Module

let isCookieBlockerEnabled = true;

chrome.storage.local.get(['cookieBlockerEnabled'], (result) => {
  if (result.cookieBlockerEnabled !== undefined) {
    isCookieBlockerEnabled = result.cookieBlockerEnabled;
  }
});

// A list of common cookie banner wrapper selectors
const COMMON_SELECTORS = [
  '#cookie-notice', '#cookie-law-info-bar', '#cookie-banner',
  '.cookie-banner', '.cookie-notice', '.cookie-consent',
  '#CybotCookiebotDialog', '#onetrust-consent-sdk',
  '.cc-window', '.optanon-alert-box-wrapper',
  'div[aria-label="cookieconsent"]',
  '#qc-cmp2-ui'
];

let bannerRemoved = false;
let observer = null;

function hideOrRejectBanner(element) {
  // Try to find a reject button
  const rejectBtn = document.evaluate(
    ".//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject')] | .//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject')] | .//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'decline')] | .//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'decline')]",
    element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
  ).singleNodeValue;
  
  if (rejectBtn) {
    try { rejectBtn.click(); } catch(e) {}
  } else {
    element.style.setProperty('display', 'none', 'important');
  }
  bannerRemoved = true;
}

function handleCookieBanners() {
  if (!isCookieBlockerEnabled || bannerRemoved) return;

  // 1. Check common selectors
  for (let selector of COMMON_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) {
      hideOrRejectBanner(element);
      if (bannerRemoved) break;
    }
  }

  if (bannerRemoved) {
    if (observer) observer.disconnect();
    return;
  }

  // 2. XPath heuristic search (much faster than iterating all divs and computing styles)
  // Looking for divs that contain keywords like "cookie" or "gdpr" and have buttons inside
  const xpath = "//div[(contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'cookie') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'gdpr')) and (//button or //a)]";
  
  try {
    const result = document.evaluate(xpath, document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    // Iterate over matching nodes
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      
      // Only check computed style for candidates matching our text/structure heuristics
      const zIndex = window.getComputedStyle(node).zIndex;
      const pos = window.getComputedStyle(node).position;
      
      if ((pos === 'fixed' || pos === 'absolute') && zIndex !== 'auto' && parseInt(zIndex) > 100) {
        hideOrRejectBanner(node);
        if (bannerRemoved) {
            if (observer) observer.disconnect();
            break;
        }
      }
    }
  } catch(e) {}
}

// Use requestIdleCallback for non-blocking checks if available
function scheduleCheck() {
  if (bannerRemoved || !isCookieBlockerEnabled) return;
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(handleCookieBanners, { timeout: 2000 });
  } else {
    setTimeout(handleCookieBanners, 500);
  }
}

// Run on load
window.addEventListener('load', () => {
  scheduleCheck();
  setTimeout(scheduleCheck, 2000);
  setTimeout(scheduleCheck, 5000);
});

// Observer for dynamically injected banners
observer = new MutationObserver((mutations) => {
  if (!isCookieBlockerEnabled || bannerRemoved) {
    observer.disconnect();
    return;
  }
  
  let hasNewNodes = false;
  for (let mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      hasNewNodes = true;
      break;
    }
  }
  
  if (hasNewNodes) {
    clearTimeout(window.cookieBannerTimeout);
    window.cookieBannerTimeout = setTimeout(scheduleCheck, 500);
  }
});

if (document.body || document.documentElement) {
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    });
}
