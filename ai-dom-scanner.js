// AI-Heuristic DOM Scanner Module
// Scans DOM for unlabeled or obfuscated native ads by text and structure analysis

let isAIHeuristicEnabled = true;

chrome.storage.local.get(['strictMode'], (result) => {
  if (result.strictMode !== undefined) {
    isAIHeuristicEnabled = result.strictMode;
  }
});

const AD_KEYWORDS = ['sponsored', 'promoted', 'advertisement', 'ad', 'реклама', 'спонсорский'];
const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'HTML', 'HEAD', 'BODY']);

function checkNodeForAd(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  if (IGNORED_TAGS.has(node.tagName)) return false;

  // Small elements (like labels) containing exact ad keywords
  const text = (node.innerText || '').trim().toLowerCase();
  
  if (text && text.length < 20) {
    if (AD_KEYWORDS.includes(text)) {
      return true;
    }
  }
  return false;
}

function scanDOMForAds() {
  if (!isAIHeuristicEnabled) return;

  const allElements = document.querySelectorAll('span, div, p, a');
  
  for (let el of allElements) {
    if (el.dataset.waveguardScanned) continue;
    
    if (checkNodeForAd(el)) {
      // Find a suitable container to hide (e.g., the closest article, or 2-3 levels up)
      let container = el.closest('article, [class*="post"], [class*="card"], [class*="item"]');
      if (!container) {
        // If no semantic container, go up 3 levels
        container = el.parentElement?.parentElement?.parentElement;
      }
      
      if (container && container !== document.body && container !== document.documentElement) {
        container.style.display = 'none';
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';
        // Add visual indicator for debug
        // container.style.border = '5px solid red';
      }
    }
    el.dataset.waveguardScanned = 'true';
  }
}

// Run scanner periodically
setInterval(scanDOMForAds, 3000);
