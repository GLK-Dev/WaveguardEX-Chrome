// GenAI Data Loss Prevention (DLP) Module
// Protects sensitive data (PII, Credit Cards) from being submitted to AI chatbots

const SENSITIVE_PATTERNS = [
  { name: 'Credit Card', regex: /\b(?:\d[ -]*?){13,16}\b/g },
  { name: 'Email Address', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
  { name: 'Phone Number', regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g }
];

let isDLPEnabled = true;

chrome.storage.local.get(['dlpProtectionEnabled'], (result) => {
  if (result.dlpProtectionEnabled !== undefined) {
    isDLPEnabled = result.dlpProtectionEnabled;
  }
});

function checkAndMaskText(text) {
  let maskedText = text;
  let foundSensitive = false;
  
  SENSITIVE_PATTERNS.forEach(pattern => {
    if (pattern.regex.test(maskedText)) {
      foundSensitive = true;
      maskedText = maskedText.replace(pattern.regex, '[MASKED SENSITIVE DATA]');
    }
  });
  
  return { maskedText, foundSensitive };
}

function maskTextNodesInElement(element) {
  let foundSensitiveAnywhere = false;
  
  // Use TreeWalker to only process text nodes, preserving HTML structure
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  
  while ((node = walker.nextNode())) {
    const originalText = node.nodeValue;
    if (!originalText || !originalText.trim()) continue;
    
    const { maskedText, foundSensitive } = checkAndMaskText(originalText);
    
    if (foundSensitive && originalText !== maskedText) {
      node.nodeValue = maskedText;
      foundSensitiveAnywhere = true;
    }
  }
  
  return foundSensitiveAnywhere;
}

function handleInputEvent(event) {
  if (!isDLPEnabled) return;
  
  const target = event.target;
  
  // Check textareas and standard input fields
  if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
    const { maskedText, foundSensitive } = checkAndMaskText(target.value);
    if (foundSensitive && target.value !== maskedText) {
      target.value = maskedText;
      showDLPWarning();
    }
  }
  // Check contenteditable elements (like those used in ChatGPT/Claude)
  else if (target.isContentEditable) {
    const selection = window.getSelection();
    let savedRange = null;
    if (selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
    
    const foundSensitive = maskTextNodesInElement(target);
    
    if (foundSensitive) {
      showDLPWarning();
      // Restore cursor position if possible (rough approximation after text change)
      try {
        if (savedRange) {
          selection.removeAllRanges();
          selection.addRange(savedRange);
        }
      } catch (e) {
        // Fallback: move to end
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
}

function showDLPWarning() {
  const existingWarning = document.getElementById('waveguard-dlp-warning');
  if (existingWarning) return;
  
  const warning = document.createElement('div');
  warning.id = 'waveguard-dlp-warning';
  warning.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ff4757;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    transition: opacity 0.3s;
  `;
  
  warning.innerHTML = `
    <span style="font-size: 20px;">🛡️</span>
    <div>
      <strong>Waveguard DLP Alert</strong><br/>
      Sensitive data (PII) was detected and masked before sending to AI.
    </div>
  `;
  
  document.body.appendChild(warning);
  
  setTimeout(() => {
    warning.style.opacity = '0';
    setTimeout(() => warning.remove(), 300);
  }, 4000);
}

// Attach listeners to input events (using input event captures typing in real time)
document.addEventListener('input', handleInputEvent, true);
// Also listen for paste events as people often paste sensitive info
document.addEventListener('paste', (e) => {
    // Let the paste happen, then trigger the input check slightly later
    setTimeout(() => {
        if (e.target) handleInputEvent({target: e.target});
    }, 10);
}, true);
