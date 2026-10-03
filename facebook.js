// Content Script для Facebook/Meta

(function() {
  'use strict';

  console.log('[Waveguard] Facebook/Meta script загружен');

  let isEnabled = true;
  let processedElements = new WeakSet();

  // Проверяем настройки при загрузке
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
      isEnabled = response.settings.adBlockEnabled;
    }
  });

  // Селекторы рекламы Facebook
  const facebookAdSelectors = [
    'div[data-ad-preview="message"]',
    'div[data-ad-comet-preview="message"]',
    '[role="article"][aria-label*="Sponsored"]',
    '[data-testid="story-sponsored"]',
    'a[href*="facebook.com/ads/"]',
    'a[aria-label*="Sponsored"]',
    '[data-store*=\'"is_sponsored":true\']',
    // Instagram (часть Meta)
    'div[class*="CkGkG"]', // Instagram sponsored post
    'a[href*="/ads/about/"]',
    'div[class*="_ac0i"]', // Instagram ad container
  ];

  // Функция для определения рекламы в Facebook
  // Метка рекламы - отдельный короткий элемент; поиск слова в тексте поста даёт ложные срабатывания
  const SPONSORED_LABELS = new Set(['sponsored', 'реклама', 'спонсировано']);

  function isFacebookAd(element) {
    const ariaLabel = (element.getAttribute('aria-label') || '').trim().toLowerCase();
    if (SPONSORED_LABELS.has(ariaLabel)) return true;

    for (const node of element.querySelectorAll('span, a, div[aria-label]')) {
      const text = (node.textContent || '').trim().toLowerCase();
      const label = (node.getAttribute('aria-label') || '').trim().toLowerCase();
      if (SPONSORED_LABELS.has(text) || SPONSORED_LABELS.has(label)) return true;
    }

    return false;
  }

  // Функция для блокировки рекламы Facebook
  function removeFacebookAds() {
    if (!isEnabled) return;

    let blocked = 0;

    // Удаляем по селекторам
    facebookAdSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (!processedElements.has(element)) {
            processedElements.add(element);
            element.style.display = 'none';
            element.remove();
            blocked++;
          }
        });
      } catch (e) {}
    });

    // Проверяем посты в ленте (более надежный метод)
    const feedStories = document.querySelectorAll('[role="article"], [data-pagelet*="FeedUnit"]');
    feedStories.forEach(story => {
      if (!processedElements.has(story) && isFacebookAd(story)) {
        processedElements.add(story);
        
        // Находим родительский контейнер
        let container = story.closest('div[class*="du4w35lb"]') || story.parentElement;
        if (container) {
          container.style.display = 'none';
          setTimeout(() => container.remove(), 100);
          blocked++;
          console.log('[Waveguard] Facebook реклама заблокирована');
        }
      }
    });

    // Блокируем Stories рекламу
    const storyAds = document.querySelectorAll('[data-testid="story-card"]');
    storyAds.forEach(story => {
      if (!processedElements.has(story)) {
        const sponsoredLabel = story.querySelector('[data-testid="story-sponsored"]');
        if (sponsoredLabel || isFacebookAd(story)) {
          processedElements.add(story);
          story.style.display = 'none';
          story.remove();
          blocked++;
          console.log('[Waveguard] Facebook Story реклама заблокирована');
        }
      }
    });

    // Блокируем видео рекламу
    const videoAds = document.querySelectorAll('video[data-ad], div[data-ad-preview]');
    videoAds.forEach(ad => {
      if (!processedElements.has(ad)) {
        processedElements.add(ad);
        const container = ad.closest('div[role="article"]') || ad.parentElement;
        if (container) {
          container.style.display = 'none';
          container.remove();
          blocked++;
        }
      }
    });

    if (blocked > 0) {
      chrome.runtime.sendMessage({ action: 'adBlocked' });
    }
  }

  // Запускаем при загрузке
  setTimeout(removeFacebookAds, 1000); // Задержка для полной загрузки

  // Наблюдаем за изменениями (с throttling)
  let throttleTimeout = null;
  const observer = new MutationObserver(() => {
    if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        removeFacebookAds();
        throttleTimeout = null;
      }, 500);
    }
  });

  // At document_start <body> doesn't exist yet, so observe the root element.
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Отслеживаем скроллинг
  let scrollTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      removeFacebookAds();
    }, 1000);
  }, { passive: true });

  console.log('[Waveguard] Facebook/Meta ad blocker активирован');
})();
