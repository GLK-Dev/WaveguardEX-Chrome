// Auto-Reject Cookie Banners Module

const COOKIE_KEYWORDS = ['cookie', 'consent', 'gdpr', 'privacy', 'tracking', 'accept', 'agree', 'decline', 'reject', 'dismiss', 'gotit', 'allow'];

let isCookieBlockerEnabled = true;

chrome.storage.local.get(['cookieBlockerEnabled'], (result) => {
  if (result.cookieBlockerEnabled !== undefined) {
    isCookieBlockerEnabled = result.cookieBlockerEnabled;
  }
});

function handleCookieBanners() {
  if (!isCookieBlockerEnabled) return;

  // Most common cookie banner classes/ids
  const commonSelectors = [
    '#cookie-notice', '#cookie-law-info-bar', '#cookie-banner',
    '.cookie-banner', '.cookie-notice', '.cookie-consent',
    '#CybotCookiebotDialog', '#onetrust-consent-sdk',
    '.cc-window', '.optanon-alert-box-wrapper',
    'div[aria-label="cookieconsent"]',
    '#qc-cmp2-ui'
  ];

  let bannerRemoved = false;

  // Try removing well-known banners by selector
  commonSelectors.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      // Look for a reject button inside before removing
      const rejectBtn = Array.from(element.querySelectorAll('button, a')).find(el => 
        /reject|decline|disagree|no thanks|deny/i.test(el.innerText || el.textContent)
      );
      
      if (rejectBtn) {
        rejectBtn.click();
      } else {
        element.style.display = 'none';
        element.style.setProperty('display', 'none', 'important');
      }
      bannerRemoved = true;
    }
  });

  // Fallback: heuristic search for cookie banners
  if (!bannerRemoved) {
    const divs = document.querySelectorAll('div');
    for (let div of divs) {
      const zIndex = window.getComputedStyle(div).zIndex;
      const pos = window.getComputedStyle(div).position;
      
      // Cookie banners usually have high z-index and fixed/absolute position
      if ((pos === 'fixed' || pos === 'absolute') && zIndex !== 'auto' && parseInt(zIndex) > 1000) {
        const text = div.innerText ? div.innerText.toLowerCase() : '';
        if (COOKIE_KEYWORDS.filter(kw => text.includes(kw)).length >= 2) {
          // Found likely cookie banner
          const rejectBtn = Array.from(div.querySelectorAll('button, a')).find(el => 
            /reject|decline|disagree/i.test(el.innerText || el.textContent)
          );
          if (rejectBtn) {
            rejectBtn.click();
          } else {
            div.style.display = 'none';
          }
          break; // only remove one
        }
      }
    }
  }
}

// Run on load and periodically in case of delayed injection
window.addEventListener('load', () => {
  handleCookieBanners();
  setTimeout(handleCookieBanners, 2000);
  setTimeout(handleCookieBanners, 5000);
});

// Create a MutationObserver to catch dynamically injected banners
const observer = new MutationObserver((mutations) => {
  if (isCookieBlockerEnabled) {
    for (let mutation of mutations) {
      if (mutation.addedNodes.length) {
        // Debounce slightly to avoid performance hits
        clearTimeout(window.cookieBannerTimeout);
        window.cookieBannerTimeout = setTimeout(handleCookieBanners, 500);
        break;
      }
    }
  }
});

observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
