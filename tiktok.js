// Content Script для TikTok

(function() {
  'use strict';

  console.log('[Waveguard] TikTok script загружен');

  let isEnabled = true;
  let processedElements = new WeakSet();

  // Проверяем настройки при загрузке
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
      isEnabled = response.settings.adBlockEnabled;
    }
  });

  // Селекторы рекламы TikTok
  const tiktokAdSelectors = [
    '[data-e2e="ad-tag"]',
    '[data-e2e="ad-card"]',
    '.tiktok-ad',
    '[class*="DivAdContainer"]',
    '[class*="AdItem"]',
    '[class*="advertising"]',
    'div[data-ad]',
    '.video-card-ad',
    '[aria-label*="ad"]',
    '[aria-label*="Ad"]',
    '[aria-label*="Sponsored"]',
    '[class*="sponsor"]',
    '.promoted-video',
    '[data-promoted="true"]'
  ];

  // Функция для блокировки рекламы TikTok
  function removeTikTokAds() {
    if (!isEnabled) return;

    let blocked = 0;

    tiktokAdSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (!processedElements.has(element)) {
            processedElements.add(element);
            
            // Скрываем и удаляем
            element.style.display = 'none';
            element.remove();
            blocked++;
            
            console.log('[Waveguard] TikTok реклама заблокирована');
          }
        });
      } catch (e) {}
    });

    // Блокируем рекламу в ленте по атрибутам
    const feedItems = document.querySelectorAll('[data-e2e="recommend-list-item-container"]');
    feedItems.forEach(item => {
      if (!processedElements.has(item)) {
        // Проверяем наличие рекламных маркеров
        const adMarker = item.querySelector('[data-e2e="ad-tag"], .video-card-ad-tag');
        if (adMarker) {
          processedElements.add(item);
          item.style.display = 'none';
          item.remove();
          blocked++;
          console.log('[Waveguard] TikTok рекламное видео удалено');
        }
      }
    });

    if (blocked > 0) {
      chrome.runtime.sendMessage({ action: 'adBlocked' });
    }
  }

  // Пропуск рекламных видео при автовоспроизведении
  function skipTikTokAdVideo() {
    if (!isEnabled) return;

    const video = document.querySelector('video[autoplay]');
    if (video) {
      const container = video.closest('[data-e2e="recommend-list-item-container"]');
      if (container) {
        const adTag = container.querySelector('[data-e2e="ad-tag"]');
        if (adTag) {
          console.log('[Waveguard] Пропускаем рекламное видео TikTok');
          
          // Ищем кнопку "Далее"
          const nextButton = document.querySelector('[data-e2e="arrow-right"], [aria-label*="Next"]');
          if (nextButton) {
            nextButton.click();
          } else {
            // Пытаемся скролить к следующему видео
            container.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
          
          chrome.runtime.sendMessage({ action: 'adBlocked' });
        }
      }
    }
  }

  // Блокируем рекламные запросы
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && isEnabled) {
      if (url.includes('/api/ad/') || 
          url.includes('/advertising/') ||
          url.includes('analytics.tiktok.com') ||
          url.includes('/commercial/')) {
        console.log('[Waveguard] Заблокирован TikTok рекламный запрос:', url);
        return Promise.reject(new Error('Blocked by Waveguard'));
      }
    }
    return originalFetch.apply(this, args);
  };

  // Запускаем при загрузке
  removeTikTokAds();
  skipTikTokAdVideo();

  // Наблюдаем за изменениями (с throttling)
  let throttleTimeout = null;
  const observer = new MutationObserver(() => {
    if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        removeTikTokAds();
        skipTikTokAdVideo();
        throttleTimeout = null;
      }, 300);
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Отслеживаем скроллинг для автоматического пропуска
  let scrollTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      skipTikTokAdVideo();
    }, 500);
  }, { passive: true });

  console.log('[Waveguard] TikTok ad blocker активирован');
})();
