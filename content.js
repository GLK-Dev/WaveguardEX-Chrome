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
    '[class*="ad-banner"]',
    '[id*="ad-banner"]',
    '[class*="banner-ad"]',
    '[id*="banner-ad"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="ads"]',
    '[class*="sponsored-content"]',
    '[class*="sponsor-block"]',
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

  // Элементы, которые нельзя скрывать, даже если они совпали с рекламным селектором
  // (защита от false-positive совпадений на структурных контейнерах страницы)
  function isCriticalElement(element) {
    const tag = element.tagName;
    if (tag === 'HTML' || tag === 'BODY' || tag === 'MAIN' || tag === 'ARTICLE') return true;
    if (element.querySelector('video, audio')) return true;

    const id = (element.id || '').toLowerCase();
    if (/^(app|root|main|content|page|wrapper|__next)$/.test(id)) return true;

    // Слишком крупный элемент (значительная часть вьюпорта) - вероятно, не реклама, а контейнер контента
    const rect = element.getBoundingClientRect();
    const viewportArea = window.innerWidth * window.innerHeight;
    if (viewportArea > 0 && rect.width * rect.height > viewportArea * 0.5) return true;

    return false;
  }

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
            if (isCriticalElement(element)) return;

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

  // Блокировка рекламных iframe и canvas fingerprint noise перенесены в page-guard.js
  // (эти патчи должны работать в MAIN world, а не в изолированном контексте content script)

  console.log('[Waveguard] Content script загружен с защитой');
})();
