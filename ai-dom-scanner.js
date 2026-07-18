// AI-Heuristic DOM Scanner Module
// Scans DOM for unlabeled or obfuscated native ads by text and structure analysis
// Optimized with IntersectionObserver and textContent

let isAIHeuristicEnabled = true;

chrome.storage.local.get(['strictMode'], (result) => {
  if (result.strictMode !== undefined) {
    isAIHeuristicEnabled = result.strictMode;
  }
});

const AD_KEYWORDS = ['sponsored', 'promoted', 'advertisement', 'ad', 'реклама', 'спонсорский'];
const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'HTML', 'HEAD', 'BODY', 'SVG', 'PATH']);

function checkNodeForAd(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  if (IGNORED_TAGS.has(node.tagName)) return false;

  // Use textContent instead of innerText to prevent layout thrashing
  const text = (node.textContent || '').trim().toLowerCase();
  
  if (text && text.length < 20) {
    if (AD_KEYWORDS.includes(text)) {
      // Avoid false positives like "add" or partial matches inside longer unseparated strings by verifying exact matches
      // but AD_KEYWORDS.includes already does an exact match since it's checking the whole trim() string
      return true;
    }
  }
  return false;
}

// Hide the element
function hideAdElement(el) {
  let container = el.closest('article, [class*="post"], [class*="card"], [class*="item"]');
  if (!container) {
    container = el.parentElement?.parentElement?.parentElement;
  }
  
  if (container && container !== document.body && container !== document.documentElement) {
    container.style.display = 'none';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
  }
}

// 1. Intersection Observer to only scan elements when they come into view
const visibilityObserver = new IntersectionObserver((entries, observer) => {
  if (!isAIHeuristicEnabled) return;

  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      
      if (checkNodeForAd(el)) {
        hideAdElement(el);
      }
      
      // Stop observing once checked
      observer.unobserve(el);
    }
  });
}, {
  rootMargin: '200px', // start scanning 200px before it enters viewport
  threshold: 0
});

// 2. MutationObserver to watch for new potential ad nodes
const domObserver = new MutationObserver((mutations) => {
  if (!isAIHeuristicEnabled) return;
  
  for (let mutation of mutations) {
    for (let node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Only observe small text containers
        const tags = node.querySelectorAll('span, p, a, div');
        
        // If the node itself is one of these
        if (['SPAN', 'P', 'A', 'DIV'].includes(node.tagName)) {
           if (!node.dataset.waveguardScanned) {
               node.dataset.waveguardScanned = 'true';
               visibilityObserver.observe(node);
           }
        }
        
        // And its children
        for (let child of tags) {
          if (!child.dataset.waveguardScanned) {
            child.dataset.waveguardScanned = 'true';
            visibilityObserver.observe(child);
          }
        }
      }
    }
  }
});

function initScanner() {
  if (!isAIHeuristicEnabled) return;
  
  const allElements = document.querySelectorAll('span, div, p, a');
  for (let el of allElements) {
    if (!el.dataset.waveguardScanned) {
        el.dataset.waveguardScanned = 'true';
        visibilityObserver.observe(el);
    }
  }
  
  if (document.body || document.documentElement) {
    domObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScanner);
} else {
    initScanner();
}
