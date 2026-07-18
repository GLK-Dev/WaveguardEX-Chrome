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
    '[data-pagelet*="FeedUnit_"]',
    'div[data-ad-preview="message"]',
    'div[data-ad-comet-preview="message"]',
    '[role="article"][aria-label*="Sponsored"]',
    '[data-testid="story-sponsored"]',
    'a[href*="facebook.com/ads/"]',
    'a[aria-label*="Sponsored"]',
    'div[class*="story"][class*="ad"]',
    '[data-store*=\'"is_sponsored":true\']',
    // Instagram (часть Meta)
    'div[class*="CkGkG"]', // Instagram sponsored post
    'a[href*="/ads/about/"]',
    'div[class*="_ac0i"]', // Instagram ad container
  ];

  // Функция для определения рекламы в Facebook
  function isFacebookAd(element) {
    // Проверяем текст "Sponsored" или "Реклама"
    const sponsoredText = element.textContent || '';
    if (sponsoredText.includes('Sponsored') || 
        sponsoredText.includes('Реклама') ||
        sponsoredText.includes('Рекламa') ||
        sponsoredText.includes('Sponsored ·')) {
      return true;
    }

    // Проверяем aria-label
    const ariaLabel = element.getAttribute('aria-label') || '';
    if (ariaLabel.includes('Sponsored') || ariaLabel.includes('Реклама')) {
      return true;
    }

    // Проверяем наличие рекламных ссылок
    const adLinks = element.querySelectorAll('a[href*="/ads/"], a[href*="fbclid="]');
    if (adLinks.length > 0) {
      return true;
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

  // Блокируем рекламные запросы
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && isEnabled) {
      if (url.includes('/ads/') || 
          url.includes('/ad_') ||
          url.includes('facebook.com/tr') ||
          url.includes('connect.facebook.net/signals') ||
          url.includes('/adspixel/') ||
          url.includes('/logging_client_events')) {
        console.log('[Waveguard] Заблокирован Facebook рекламный запрос');
        return Promise.reject(new Error('Blocked by Waveguard'));
      }
    }
    return originalFetch.apply(this, args);
  };

  // Блокируем Facebook Pixel
  if (window.fbq) {
    window.fbq = function() {
      console.log('[Waveguard] Facebook Pixel заблокирован');
    };
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

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

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
