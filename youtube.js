// Content Script специально для YouTube (Оптимизированная версия)

(function() {
  'use strict';

  console.log('[Waveguard] YouTube script загружен');

  let adCheckInterval = null;
  let isEnabled = true;
  let processedElements = new WeakSet();
  
  // Проверяем настройки при загрузке
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
      isEnabled = response.settings.youtubeAdBlockEnabled;
    }
  });

  // Отслеживание рекламных сегментов в видео
  let lastCheckedTime = 0;
  let isAdSegmentPlaying = false;

  // Функция для обнаружения и пропуска рекламных сегментов
  function skipAdSegments() {
    if (!isEnabled) return;

    const video = document.querySelector('video');
    if (!video) return;

    // Проверяем индикаторы рекламы на временной шкале
    const adMarkers = document.querySelectorAll('.ytp-ad-preview-container, .ytp-ad-preview-slot');
    
    // Проверяем текущее время каждые 0.5 секунды
    if (Math.abs(video.currentTime - lastCheckedTime) < 0.5) return;
    lastCheckedTime = video.currentTime;

    // Определяем рекламный сегмент по индикаторам YouTube
    const playerAd = document.querySelector('.video-ads.ytp-ad-module');
    const adShowing = document.querySelector('.ad-showing');
    const adText = document.querySelector('.ytp-ad-text');
    
    if (playerAd || adShowing || adText) {
      isAdSegmentPlaying = true;
      
      // Пытаемся пропустить сегмент
      try {
        // Проверяем длину рекламы
        const adDuration = video.duration;
        
        if (adDuration && adDuration < 120) { // Реклама обычно короче 2 минут
          // Перематываем к концу рекламного сегмента
          video.currentTime = adDuration - 0.1;
          console.log('[Waveguard] Рекламный сегмент пропущен');
          chrome.runtime.sendMessage({ action: 'adBlocked' });
        }
      } catch (e) {}
    } else if (isAdSegmentPlaying) {
      isAdSegmentPlaying = false;
      console.log('[Waveguard] Возврат к основному видео');
    }
  }

  // Функция для пропуска рекламы на YouTube (оптимизированная)
  function skipYouTubeAd() {
    if (!isEnabled) return;

    // Ищем кнопку "Пропустить рекламу"
    const skipButtons = [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      'button.ytp-ad-skip-button',
      '.ytp-ad-skip-button-container button',
      '.ytp-skip-ad-button__text'
    ];

    for (const selector of skipButtons) {
      try {
        const button = document.querySelector(selector);
        if (button && !processedElements.has(button)) {
          processedElements.add(button);
          button.click();
          console.log('[Waveguard] Реклама пропущена');
          chrome.runtime.sendMessage({ action: 'adBlocked' });
          return true;
        }
      } catch (e) {}
    }

    // Проверяем наличие рекламы
    const video = document.querySelector('video');
    if (video) {
      const adContainer = document.querySelector('.video-ads.ytp-ad-module');
      const adPlaying = document.querySelector('.ad-showing');
      
      if (adContainer || adPlaying) {
        // Максимально ускоряем рекламу
        try {
          if (video.duration && video.duration < 60) {
            // Перематываем к концу
            video.currentTime = video.duration - 0.1;
            video.playbackRate = 16; // Максимальная скорость
            video.muted = true;
            console.log('[Waveguard] Реклама ускорена');
          }
        } catch (e) {}

        // Скрываем рекламный оверлей
        const adOverlays = document.querySelectorAll('.ytp-ad-overlay-container, .ytp-ad-text-overlay');
        adOverlays.forEach(overlay => {
          if (!processedElements.has(overlay)) {
            processedElements.add(overlay);
            overlay.style.display = 'none';
          }
        });
      }
    }

    return false;
  }

  // Функция для скрытия рекламных элементов на странице YouTube
  function hideYouTubeAds() {
    if (!isEnabled) return;

    // Селекторы для YouTube рекламы
    const youtubeAdSelectors = [
      'ytd-display-ad-renderer',
      'ytd-promoted-sparkles-web-renderer',
      'ytd-banner-promo-renderer',
      'ytd-statement-banner-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-ad-slot-renderer',
      'yt-mealbar-promo-renderer',
      '.ytd-merch-shelf-renderer',
      'ytd-companion-slot-renderer',
      '#masthead-ad',
      '#player-ads',
      '.video-ads',
      '.ytp-ad-module',
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay',
      'ytd-action-companion-ad-renderer',
      'ytd-watch-flexy[theater] #player-ads'
    ];

    let blocked = 0;
    youtubeAdSelectors.forEach(selector => {
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

    if (blocked > 0) {
      chrome.runtime.sendMessage({ action: 'adBlocked' });
    }
  }

  // Запускаем проверку рекламы каждые 300ms (оптимизировано)
  function startAdChecking() {
    if (adCheckInterval) return;
    
    adCheckInterval = setInterval(() => {
      skipYouTubeAd();
      hideYouTubeAds();
      skipAdSegments(); // Проверяем рекламные сегменты
    }, 300);
  }

  // Останавливаем проверку
  function stopAdChecking() {
    if (adCheckInterval) {
      clearInterval(adCheckInterval);
      adCheckInterval = null;
    }
  }

  // Запускаем при загрузке страницы
  skipYouTubeAd();
  hideYouTubeAds();
  startAdChecking();

  // Наблюдаем за изменениями DOM (с throttling)
  let throttleTimeout = null;
  const observer = new MutationObserver((mutations) => {
    if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        hideYouTubeAds();
        skipYouTubeAd();
        throttleTimeout = null;
      }, 200);
    }
  });

  // Ждем загрузки body
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

  // Отслеживаем переходы по YouTube (SPA) - оптимизировано
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('[Waveguard] Обнаружена навигация на YouTube');
      // Очищаем кэш обработанных элементов при смене страницы
      processedElements = new WeakSet();
      setTimeout(() => {
        skipYouTubeAd();
        hideYouTubeAds();
      }, 100);
    }
  }).observe(document, { subtree: true, childList: true });

  // Слушаем события видео для немедленной реакции
  document.addEventListener('play', () => {
    setTimeout(skipYouTubeAd, 100);
    setTimeout(skipAdSegments, 100);
  }, true);
  
  document.addEventListener('loadstart', () => {
    setTimeout(skipYouTubeAd, 100);
  }, true);

  // Постоянный мониторинг времени воспроизведения для пропуска сегментов
  document.addEventListener('timeupdate', () => {
    skipAdSegments();
  }, true);

  // Дополнительная защита - блокируем попытки показа рекламы
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && isEnabled) {
      if (url.includes('/api/stats/ads') || 
          url.includes('/pagead/') || 
          url.includes('/ptracking') ||
          url.includes('/ads') ||
          url.includes('/get_video_info')) {
        console.log('[Waveguard] Заблокирован запрос рекламы:', url);
        return Promise.reject(new Error('Blocked by Waveguard'));
      }
    }
    return originalFetch.apply(this, args);
  };

  // Перехватываем XMLHttpRequest для блокировки рекламных запросов
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && isEnabled) {
      if (url.includes('/api/stats/ads') || 
          url.includes('/pagead/') || 
          url.includes('/ptracking') ||
          url.includes('/ads')) {
        console.log('[Waveguard] Заблокирован XHR запрос рекламы:', url);
        // Перенаправляем на пустой ответ
        return originalOpen.call(this, method, 'data:text/plain,');
      }
    }
    return originalOpen.apply(this, arguments);
  };

  // Мониторинг изменений в плеере для обнаружения переключения на рекламу
  let lastVideoSrc = '';
  setInterval(() => {
    const video = document.querySelector('video');
    if (video && video.src !== lastVideoSrc) {
      lastVideoSrc = video.src;
      
      // Проверяем, не является ли это рекламным видео
      if (video.src.includes('doubleclick') || 
          video.src.includes('googleads') ||
          video.src.includes('googlevideo.com/videoplayback') && document.querySelector('.ad-showing')) {
        console.log('[Waveguard] Обнаружено рекламное видео, пропускаем...');
        video.currentTime = video.duration - 0.1;
        chrome.runtime.sendMessage({ action: 'adBlocked' });
      }
    }
  }, 500);

  console.log('[Waveguard] YouTube ad blocker активирован (агрессивный режим с пропуском сегментов)');
})();
