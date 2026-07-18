// Security Content Script - Защита от фишинга, вредоносных сайтов и ПНП

(function() {
  'use strict';

  console.log('[Waveguard Security] Модуль безопасности загружен');

  let isSecurityEnabled = true;
  let blockedThreatsCount = 0;

  // Загружаем черный список вредоносных доменов
  let maliciousDomains = {
    phishing: [],
    malware: [],
    cryptojacking: [],
    pup_domains: [],
    suspicious_tlds: [],
    scam_keywords: []
  };

  // Загружаем базу данных
  fetch(chrome.runtime.getURL('malicious-domains.json'))
    .then(response => response.json())
    .then(data => {
      maliciousDomains = data;
      console.log('[Waveguard Security] База угроз загружена:', Object.keys(data).length, 'категорий');
      checkCurrentPage();
    })
    .catch(err => console.error('[Waveguard Security] Ошибка загрузки базы угроз:', err));

  // Проверяем настройки
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
      isSecurityEnabled = response.settings.securityProtection !== false;
    }
  });

  // Функция для проверки URL на вредоносность
  function checkURL(url) {
    if (!isSecurityEnabled) return { safe: true };

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();

      // Проверка фишинга
      for (let pattern of maliciousDomains.phishing) {
        if (matchPattern(hostname, pattern)) {
          return { 
            safe: false, 
            threat: 'phishing',
            message: 'Обнаружена попытка фишинговой атаки! Этот сайт может украсть ваши данные.'
          };
        }
      }

      // Проверка вредоносных доменов
      for (let pattern of maliciousDomains.malware) {
        if (matchPattern(hostname, pattern)) {
          return { 
            safe: false, 
            threat: 'malware',
            message: 'Обнаружен вредоносный сайт! Этот сайт может заразить ваш компьютер.'
          };
        }
      }

      // Проверка криптоджекинга
      for (let pattern of maliciousDomains.cryptojacking) {
        if (matchPattern(hostname, pattern)) {
          return { 
            safe: false, 
            threat: 'cryptojacking',
            message: 'Обнаружен майнинг-скрипт! Этот сайт пытается использовать ваш процессор.'
          };
        }
      }

      // Проверка ПНП (потенциально нежелательные программы)
      for (let pattern of maliciousDomains.pup_domains) {
        if (matchPattern(hostname, pattern)) {
          return { 
            safe: false, 
            threat: 'pup',
            message: 'Обнаружен сайт с ПНП! Может установить нежелательное ПО.'
          };
        }
      }

      // Проверка подозрительных доменных зон
      for (let tld of maliciousDomains.suspicious_tlds) {
        if (hostname.endsWith(tld)) {
          return { 
            safe: false, 
            threat: 'suspicious',
            message: 'Подозрительный домен! Будьте осторожны на этом сайте.'
          };
        }
      }

      // Проверка мошеннических ключевых слов в URL
      for (let keyword of maliciousDomains.scam_keywords) {
        if (fullUrl.includes(keyword)) {
          return { 
            safe: false, 
            threat: 'scam',
            message: 'Обнаружен возможный скам! Этот сайт может быть мошенническим.'
          };
        }
      }

      return { safe: true };

    } catch (e) {
      console.error('[Waveguard Security] Ошибка проверки URL:', e);
      return { safe: true }; // В случае ошибки считаем безопасным
    }
  }

  // Функция для сопоставления паттернов (поддержка wildcards)
  function matchPattern(hostname, pattern) {
    pattern = pattern.toLowerCase().replace(/\*/g, '.*').replace(/\./g, '\\.');
    const regex = new RegExp('^' + pattern + '$');
    return regex.test(hostname);
  }

  // Проверка текущей страницы
  function checkCurrentPage() {
    if (!isSecurityEnabled) return;

    const result = checkURL(window.location.href);
    if (!result.safe) {
      blockedThreatsCount++;
      chrome.runtime.sendMessage({ 
        action: 'threatBlocked',
        threat: result.threat
      });
      showWarningPage(result);
    }
  }

  // Показать страницу предупреждения
  function showWarningPage(result) {
    // Создаем overlay с предупреждением
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(220, 38, 38, 0.95);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const threatIcons = {
      phishing: '🎣',
      malware: '☠️',
      cryptojacking: '⛏️',
      pup: '⚠️',
      suspicious: '🚨',
      scam: '💸'
    };

    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 10px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      ">
        <div style="font-size: 64px; margin-bottom: 20px;">
          ${threatIcons[result.threat] || '🛡️'}
        </div>
        <h1 style="color: #dc2626; margin: 0 0 20px 0; font-size: 28px;">
          Опасность!
        </h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          ${result.message}
        </p>
        <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
          <strong>URL:</strong><br>
          <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 5px; word-break: break-all;">
            ${window.location.href}
          </code>
        </p>
        <button id="WaveguardGoBack" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          font-weight: 600;
          margin-right: 10px;
        ">
          🔙 Вернуться назад
        </button>
        <button id="WaveguardProceed" style="
          background: #f3f4f6;
          color: #666;
          border: 2px solid #d1d5db;
          padding: 15px 40px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          font-weight: 600;
        ">
          Продолжить на свой риск
        </button>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Защищено Waveguard Security v4.0
        </p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Обработчики кнопок
    document.getElementById('WaveguardGoBack').addEventListener('click', () => {
      window.history.back();
    });

    document.getElementById('WaveguardProceed').addEventListener('click', () => {
      overlay.remove();
    });
  }

  // Блокировка загрузки ПНП (потенциально нежелательных программ)
  function blockPUPDownloads() {
    if (!isSecurityEnabled) return;

    const pupExtensions = [
      '.exe', '.msi', '.bat', '.cmd', '.scr', '.pif', 
      '.com', '.vbs', '.js', '.jar', '.app', '.dmg'
    ];

    const suspiciousKeywords = [
      'setup', 'installer', 'download-manager', 'codec', 
      'player', 'toolbar', 'optimizer', 'cleaner', 'driver-update'
    ];

    // Перехватываем клики на ссылки загрузки
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link || !link.href) return;

      const href = link.href.toLowerCase();
      const isPUP = pupExtensions.some(ext => href.endsWith(ext)) &&
                    suspiciousKeywords.some(keyword => href.includes(keyword));

      if (isPUP) {
        e.preventDefault();
        e.stopPropagation();

        if (confirm('⚠️ Waveguard Security: Обнаружена попытка загрузки потенциально нежелательной программы!\n\nФайл: ' + link.href + '\n\nВы уверены, что хотите продолжить?')) {
          window.location.href = link.href;
        } else {
          blockedThreatsCount++;
          chrome.runtime.sendMessage({ 
            action: 'threatBlocked',
            threat: 'pup_download'
          });
        }
      }
    }, true);
  }

  // Защита от агрессивных всплывающих окон
  function blockAggressivePopups() {
    if (!isSecurityEnabled) return;

    let popupAttempts = 0;
    const maxPopups = 2;

    // Перехватываем window.open
    const originalOpen = window.open;
    window.open = function(...args) {
      popupAttempts++;
      
      if (popupAttempts > maxPopups) {
        console.log('[Waveguard Security] Заблокировано всплывающее окно:', args[0]);
        blockedThreatsCount++;
        chrome.runtime.sendMessage({ 
          action: 'threatBlocked',
          threat: 'popup'
        });
        return null;
      }

      return originalOpen.apply(this, args);
    };

    // Сброс счетчика каждые 5 секунд
    setInterval(() => {
      popupAttempts = 0;
    }, 5000);
  }

  // Блокировка криптоджекинг скриптов
  function blockCryptojacking() {
    if (!isSecurityEnabled) return;

    // Список известных криптомайнинг библиотек
    const cryptoMinerPatterns = [
      'coinhive', 'coin-hive', 'jsecoin', 'crypto-loot',
      'cryptoloot', 'webminepool', 'monerominer', 'minero'
    ];

    // Блокируем создание Web Workers (используются для майнинга)
    const originalWorker = window.Worker;
    window.Worker = function(scriptURL) {
      const url = scriptURL.toString().toLowerCase();
      
      for (let pattern of cryptoMinerPatterns) {
        if (url.includes(pattern)) {
          console.log('[Waveguard Security] Заблокирован криптомайнер:', scriptURL);
          blockedThreatsCount++;
          chrome.runtime.sendMessage({ 
            action: 'threatBlocked',
            threat: 'cryptojacking'
          });
          throw new Error('Blocked by Waveguard Security');
        }
      }

      return new originalWorker(scriptURL);
    };

    // Блокируем известные майнинг объекты
    const cryptoObjects = ['CoinHive', 'CRLT', 'JSEcoin'];
    cryptoObjects.forEach(obj => {
      try {
        Object.defineProperty(window, obj, {
          get: function() {
            console.log('[Waveguard Security] Заблокирована попытка майнинга:', obj);
            blockedThreatsCount++;
            chrome.runtime.sendMessage({ 
              action: 'threatBlocked',
              threat: 'cryptojacking'
            });
            return undefined;
          },
          set: function() {
            return false;
          },
          configurable: true
        });
      } catch (e) {
        // Свойство уже может быть защищено другим блокировщиком
        console.log('[Waveguard Security] Объект ' + obj + ' уже защищен или не может быть переопределен.');
      }
    });
  }

  // Защита от clickjacking
  function preventClickjacking() {
    if (!isSecurityEnabled) return;

    // Проверяем, загружена ли страница в iframe
    if (window.self !== window.top) {
      try {
        // Пытаемся получить доступ к родительскому окну
        const parentOrigin = window.parent.location.origin;
        const currentOrigin = window.location.origin;

        // Если домены разные - возможен clickjacking
        if (parentOrigin !== currentOrigin) {
          console.warn('[Waveguard Security] Обнаружена попытка clickjacking');
          
          // Опционально: блокируем отображение
          if (confirm('⚠️ Waveguard Security: Эта страница загружена в подозрительном фрейме!\n\nВозможна попытка кликджекинга. Открыть страницу в новой вкладке?')) {
            window.top.location = window.location.href;
          }
        }
      } catch (e) {
        // Ошибка доступа = разные домены = возможная угроза
        console.warn('[Waveguard Security] Подозрение на clickjacking (cross-origin iframe)');
      }
    }
  }

  // Мониторинг подозрительной активности
  function monitorSuspiciousActivity() {
    if (!isSecurityEnabled) return;

    // Отслеживаем множественные автоматические редиректы
    let redirectCount = 0;
    let lastURL = window.location.href;
    let userInteracted = false;

    // Клик означает, что пользователь сам инициировал навигацию (например, в SPA вроде YouTube)
    document.addEventListener('click', () => {
      userInteracted = true;
      redirectCount = 0;
      setTimeout(() => { userInteracted = false; }, 5000); // Сбрасываем флаг через 5 секунд
    }, { capture: true, passive: true });

    // Проверяем смену URL через setInterval вместо тяжелого MutationObserver
    setInterval(() => {
      if (window.location.href !== lastURL) {
        if (!userInteracted) {
          redirectCount++;
          if (redirectCount > 3) {
            console.warn('[Waveguard Security] Обнаружено подозрительное количество автоматических редиректов');
            // В реальной ситуации здесь можно заблокировать переход
          }
        }
        lastURL = window.location.href;
      }
    }, 1000);

    // Перехватываем программные клики по ссылкам (попытка автозагрузки)
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() {
      if (!userInteracted && (this.hasAttribute('download') || this.href.match(/\.(exe|msi|bat|cmd|scr|vbs)$/i))) {
        console.warn('[Waveguard Security] Заблокирована скрытая автозагрузка файла:', this.href);
        blockedThreatsCount++;
        chrome.runtime.sendMessage({ 
          action: 'threatBlocked',
          threat: 'pup_download'
        });
        return; // Блокируем клик
      }
      return originalClick.apply(this, arguments);
    };
  }

  // Инициализация всех защитных механизмов
  function initSecurity() {
    checkCurrentPage();
    blockPUPDownloads();
    blockAggressivePopups();
    blockCryptojacking();
    preventClickjacking();
    monitorSuspiciousActivity();

    console.log('[Waveguard Security] Все защитные механизмы активированы');
  }

  // Запускаем после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurity);
  } else {
    initSecurity();
  }

  // Периодическая проверка (каждые 30 секунд)
  setInterval(checkCurrentPage, 30000);

  console.log('[Waveguard Security] Модуль безопасности активен и защищает вас');
})();
