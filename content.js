// Content Script для блокировки рекламных элементов на всех сайтах

(function() {
  'use strict';

  // Флаг активности
  let isEnabled = true;
  let processedElements = new WeakSet(); // Отслеживаем обработанные элементы

  // Селекторы рекламных элементов
  const adSelectors = [
    // Общие селекторы рекламы
    '[class*="advertisement"]',
    '[id*="advertisement"]',
    '[class*="ad-container"]',
    '[id*="ad-container"]',
    '[class*="adsbygoogle"]',
    '[class*="banner"]',
    '[id*="banner"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="ads"]',
    '[class*="sponsor"]',
    '[id*="sponsor"]',
    '[data-ad]',
    '[data-advertisement]',
    // Яндекс реклама
    '.ya-partner',
    '#yandex_ad',
    '[id*="yandex_rtb"]',
    // Google реклама
    'ins.adsbygoogle',
    '.google-ad',
    '#google_ads_iframe',
    // Другие популярные рекламные сети
    '[class*="taboola"]',
    '[class*="outbrain"]',
    '[class*="criteo"]'
  ];

  let blockedCount = 0;
  let batchTimeout = null;

  // Функция для удаления рекламных элементов (оптимизированная)
  function removeAds() {
    if (!isEnabled) return;

    let newlyBlocked = 0;
    
    // Используем DocumentFragment для пакетной обработки
    adSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Проверяем через WeakSet (быстрее чем getAttribute)
          if (!processedElements.has(element)) {
            processedElements.add(element);
            element.style.cssText = 'display: none !important; visibility: hidden !important;';
            element.setAttribute('data-ad-blocked', 'true');
            newlyBlocked++;
            
            // В строгом режиме удаляем элемент полностью
            // element.remove();
          }
        });
      } catch (e) {
        // Игнорируем невалидные селекторы
      }
    });

    // Отправляем информацию пакетом с задержкой
    if (newlyBlocked > 0) {
      blockedCount += newlyBlocked;
      
      if (batchTimeout) clearTimeout(batchTimeout);
      batchTimeout = setTimeout(() => {
        try {
          chrome.runtime.sendMessage({
            action: 'adBlocked',
            count: newlyBlocked
          });
        } catch (e) {
          // Extension context invalidated - вкладка требует перезагрузки после обновления расширения
        }
      }, 500);
    }
  }

  // Проверяем настройки при загрузке
  try {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (chrome.runtime.lastError) return; // Игнорируем ошибки при закрытии
      if (response && response.settings) {
        isEnabled = response.settings.adBlockEnabled;
        if (isEnabled) {
          removeAds();
        }
      }
    });
  } catch (e) {
    // Ошибка контекста
  }

  // Наблюдение за динамически добавляемыми элементами (с throttling)
  let throttleTimeout = null;
  const observer = new MutationObserver((mutations) => {
    if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        removeAds();
        throttleTimeout = null;
      }, 100); // Обрабатываем не чаще раза в 100ms
    }
  });

  // Запускаем наблюдение после загрузки DOM
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  // Блокируем создание новых iframe с рекламой (защита)
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'iframe') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && typeof value === 'string' && isEnabled) {
          const adPatterns = [
            'doubleclick.net',
            'googlesyndication.com',
            'googleadservices.com',
            '/ads/',
            'advertising.com',
            'adnxs.com',
            'criteo.com',
            'taboola.com'
          ];
          
          if (adPatterns.some(pattern => value.includes(pattern))) {
            console.log('[Waveguard] Заблокирован iframe:', value);
            try {
              chrome.runtime.sendMessage({ action: 'adBlocked' });
            } catch (e) {}
            return; // Не устанавливаем src
          }
        }
        return originalSetAttribute.call(element, name, value);
      };
    }
    
    return element;
  };

  // Защита от fingerprinting (опционально)
  if (navigator.getBattery) {
    delete navigator.getBattery; // Блокируем Battery API
  }
  
  // Защита от Canvas fingerprinting
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(type) {
    if (type === 'image/png' && this.width === 16 && this.height === 16) {
      // Возможная попытка fingerprinting
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
    return originalToDataURL.apply(this, arguments);
  };

  console.log('[Waveguard] Content script загружен с защитой');
})();
