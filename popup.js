// Popup script для управления расширением

document.addEventListener('DOMContentLoaded', () => {
  const adBlockToggle = document.getElementById('adBlockToggle');
  const youtubeToggle = document.getElementById('youtubeToggle');
  const tiktokToggle = document.getElementById('tiktokToggle');
  const facebookToggle = document.getElementById('facebookToggle');
  const strictModeToggle = document.getElementById('strictModeToggle');
  const antiTrackingToggle = document.getElementById('antiTrackingToggle');
  const blockAnalyticsToggle = document.getElementById('blockAnalyticsToggle');
  const securityToggle = document.getElementById('securityToggle');
const miniModeToggle = document.getElementById('miniModeToggle');
  const blockedCountElement = document.getElementById('blockedCount');
  const threatsCountElement = document.getElementById('threatsCount');
  const resetCounterBtn = document.getElementById('resetCounter');
  const advancedToggle = document.getElementById('advancedToggle');
  const advancedControls = document.getElementById('advancedControls');
  const languageSelector = document.getElementById('languageSelector');

  // Загружаем текущие настройки
  chrome.storage.sync.get([
    'adBlockEnabled',
    'youtubeAdBlockEnabled',
    'tiktokAdBlockEnabled',
    'facebookAdBlockEnabled',
    'strictMode',
    'antiTracking',
    'blockAnalytics',
    'securityProtection',
    'language'
  ], (result) => {
    adBlockToggle.checked = result.adBlockEnabled !== false;
    youtubeToggle.checked = result.youtubeAdBlockEnabled !== false;
    tiktokToggle.checked = result.tiktokAdBlockEnabled !== false;
    facebookToggle.checked = result.facebookAdBlockEnabled !== false;
    strictModeToggle.checked = result.strictMode || false;
    antiTrackingToggle.checked = result.antiTracking !== false;
    blockAnalyticsToggle.checked = result.blockAnalytics !== false;
    securityToggle.checked = result.securityProtection !== false;
    
    // Устанавливаем язык
    const savedLang = result.language || 'ru';
    languageSelector.value = savedLang;
    if (typeof applyTranslations === 'function') {
      applyTranslations(savedLang);
    }
  });
  
  // Загружаем счётчики из local storage
  chrome.storage.local.get(['blockedAdsCount', 'blockedThreatsCount'], (result) => {
    blockedCountElement.textContent = result.blockedAdsCount || 0;
    threatsCountElement.textContent = result.blockedThreatsCount || 0;
  });

  // Обработчик переключателя блокировки рекламы на сайтах
  adBlockToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ adBlockEnabled: enabled }, () => {
      console.log(`Блокировка рекламы ${enabled ? 'включена' : 'выключена'}`);
      
      // Перезагружаем активную вкладку
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }
    });
  });

  // Обработчик переключателя блокировки рекламы на YouTube
  youtubeToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ youtubeAdBlockEnabled: enabled }, () => {
      console.log(`Блокировка рекламы YouTube ${enabled ? 'включена' : 'выключена'}`);
      
      // Перезагружаем активную вкладку, если это YouTube
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }
    });
  });

  // Обработчик переключателя блокировки рекламы на TikTok
  tiktokToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ tiktokAdBlockEnabled: enabled }, () => {
      console.log(`Блокировка рекламы TikTok ${enabled ? 'включена' : 'выключена'}`);
      
      // Перезагружаем активную вкладку, если это TikTok
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('tiktok.com')) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }
    });
  });

  // Обработчик переключателя блокировки рекламы на Facebook/Meta
  facebookToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ facebookAdBlockEnabled: enabled }, () => {
      console.log(`Блокировка рекламы Facebook/Meta ${enabled ? 'включена' : 'выключена'}`);
      
      // Перезагружаем активную вкладку, если это Facebook или Instagram
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].url && 
              (tabs[0].url.includes('facebook.com') || tabs[0].url.includes('instagram.com'))) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }
    });
  });

  // Сброс счетчиков
  resetCounterBtn.addEventListener('click', () => {
    // Отправляем сообщение background script для сброса
    chrome.runtime.sendMessage({ action: 'resetBlockedCount' }, (response) => {
      if (response && response.success) {
        blockedCountElement.textContent = '0';
        threatsCountElement.textContent = '0';
        console.log('Счетчики сброшены');
      }
    });
  });

  // Обработчики расширенных настроек
  strictModeToggle.addEventListener('change', (e) => {
    chrome.storage.sync.set({ strictMode: e.target.checked });
  });

  antiTrackingToggle.addEventListener('change', (e) => {
    chrome.storage.sync.set({ antiTracking: e.target.checked });
  });

  blockAnalyticsToggle.addEventListener('change', (e) => {
    chrome.storage.sync.set({ blockAnalytics: e.target.checked });
  });

  // Обработчик переключателя защиты от угроз
  securityToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ securityProtection: enabled }, () => {
      console.log('[Waveguard] Защита от угроз:', enabled ? 'включена' : 'выключена');
      
      // Перезагружаем активные вкладки для применения изменений
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && !tab.url.startsWith('chrome://')) {
            chrome.tabs.reload(tab.id);
          }
        });
      });
    });
  });

  // Показать/скрыть дополнительные настройки
  advancedToggle.addEventListener('click', () => {
    const isHidden = advancedControls.style.display === 'none';
    advancedControls.style.display = isHidden ? 'block' : 'none';
    advancedToggle.textContent = isHidden ? '⚙️ Скрыть настройки' : '⚙️ Дополнительные настройки';
  });

  // Смена языка
  languageSelector.addEventListener('change', (e) => {
    const newLang = e.target.value;
    chrome.storage.sync.set({ language: newLang });
    if (typeof applyTranslations === 'function') {
      applyTranslations(newLang);
    }
  });

  // Обновляем счетчики каждую секунду из local storage
  setInterval(() => {
    chrome.storage.local.get(['blockedAdsCount', 'blockedThreatsCount'], (result) => {
      blockedCountElement.textContent = result.blockedAdsCount || 0;
      threatsCountElement.textContent = result.blockedThreatsCount || 0;
    });
  }, 1000);
});

