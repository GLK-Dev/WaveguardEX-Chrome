// GenAI Data Loss Prevention: masks card numbers, emails and phone numbers typed or pasted into AI chats.
// Detection lives in dlp-core.js (loaded first).

(function() {
  'use strict';

  const { maskSensitive } = globalThis.WaveguardDLP;

  let isDLPEnabled = true;
  chrome.storage.sync.get(['dlpProtectionEnabled'], (result) => {
    if (result.dlpProtectionEnabled !== undefined) isDLPEnabled = result.dlpProtectionEnabled;
  });
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.dlpProtectionEnabled) {
      isDLPEnabled = changes.dlpProtectionEnabled.newValue !== false;
    }
  });

  function isTextField(el) {
    return el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|email|tel|url)?$/i.test(el.type)));
  }

  // execCommand fires the same events as real typing, so React/ProseMirror state stays in sync with the DOM.
  function replaceFieldValue(el, masked) {
    el.focus();
    el.setSelectionRange(0, el.value.length);
    if (document.execCommand('insertText', false, masked)) return;

    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, masked);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function maskTextNodes(root, final) {
    let found = false;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      const { masked, found: hit } = maskSensitive(node.nodeValue, { final });
      if (hit) {
        node.nodeValue = masked;
        found = true;
      }
    }
    return found;
  }

  function moveCaretToEnd(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  let busy = false;

  // final=false while typing (see dlp-core.js); true when the text is about to leave the field.
  function maskField(target, final) {
    if (!isDLPEnabled || busy) return;
    busy = true;
    try {
      if (isTextField(target)) {
        const { masked, found } = maskSensitive(target.value, { final });
        if (found) {
          replaceFieldValue(target, masked);
          showWarning();
        }
      } else if (target && target.isContentEditable) {
        if (maskTextNodes(target, final)) {
          moveCaretToEnd(target);
          showWarning();
        }
      }
    } finally {
      busy = false;
    }
  }

  const handleInput = (event) => maskField(event.target, false);

  // Mask pasted text before it is inserted so the original never reaches the page's input handlers.
  function handlePaste(event) {
    if (!isDLPEnabled) return;
    const target = event.target;
    if (!isTextField(target) && !(target && target.isContentEditable)) return;

    const text = event.clipboardData && event.clipboardData.getData('text/plain');
    if (!text) return;
    const { masked, found } = maskSensitive(text);
    if (!found) return;

    event.preventDefault();
    event.stopPropagation();
    document.execCommand('insertText', false, masked);
    showWarning();
  }

  function showWarning() {
    if (document.getElementById('waveguard-dlp-warning')) return;

    const warning = document.createElement('div');
    warning.id = 'waveguard-dlp-warning';
    warning.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#ff4757;color:#fff;padding:15px 20px;' +
      'border-radius:8px;font:14px Arial,sans-serif;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:opacity .3s;';

    const title = document.createElement('strong');
    title.textContent = 'Waveguard DLP';
    warning.append(title, document.createElement('br'),
      document.createTextNode('Конфиденциальные данные скрыты перед отправкой в ИИ.'));
    document.body.appendChild(warning);

    setTimeout(() => {
      warning.style.opacity = '0';
      setTimeout(() => warning.remove(), 300);
    }, 4000);
  }

  document.addEventListener('input', handleInput, true);
  document.addEventListener('paste', handlePaste, true);
  // Final pass before the text can be sent: Enter, leaving the field (e.g. clicking Send), form submit.
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter') maskField(e.target, true); }, true);
  document.addEventListener('focusout', (e) => maskField(e.target, true), true);
  document.addEventListener('submit', (e) => {
    for (const field of e.target.querySelectorAll('textarea, input')) maskField(field, true);
  }, true);
})();
