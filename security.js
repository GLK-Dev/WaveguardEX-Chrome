// Content-script security module. Known-bad domains are handled before page load by
// declarativeNetRequest redirects (see background.js / warning.html); this script only guards downloads.

(function() {
  'use strict';

  let isSecurityEnabled = true;

  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (chrome.runtime.lastError) return;
    if (response && response.settings) {
      isSecurityEnabled = response.settings.securityProtection !== false;
    }
  });

  const PUP_EXTENSIONS = ['.exe', '.msi', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.jar', '.dmg'];
  const SUSPICIOUS_KEYWORDS = [
    'setup', 'installer', 'download-manager', 'codec',
    'player', 'toolbar', 'optimizer', 'cleaner', 'driver-update'
  ];

  // Ask before following a link to an executable whose file name looks like adware.
  document.addEventListener('click', (e) => {
    if (!isSecurityEnabled) return;
    const link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;

    let path;
    try {
      path = new URL(link.href).pathname.toLowerCase();
    } catch (err) {
      return;
    }

    const isPUP = PUP_EXTENSIONS.some((ext) => path.endsWith(ext)) &&
                  SUSPICIOUS_KEYWORDS.some((keyword) => path.includes(keyword));
    if (!isPUP) return;

    e.preventDefault();
    e.stopPropagation();

    if (confirm('Waveguard Security: обнаружена попытка загрузки потенциально нежелательной программы!\n\nФайл: ' + link.href + '\n\nВы уверены, что хотите продолжить?')) {
      window.location.href = link.href;
    } else {
      try {
        chrome.runtime.sendMessage({ action: 'threatBlocked', threat: 'pup_download' });
      } catch (err) {
        // Extension context invalidated (extension was reloaded)
      }
    }
  }, true);
})();
