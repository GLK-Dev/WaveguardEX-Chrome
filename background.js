// Background Service Worker для управления расширением

// Счётчик в памяти для избежания частых записей в storage
let blockedAdsCount = 0;
let blockedThreatsCount = 0;
let saveTimeout = null;

// Кэш настроек для быстрого доступа
let settings = {
  adBlockEnabled: true,
  youtubeAdBlockEnabled: true,
  tiktokAdBlockEnabled: true,
  facebookAdBlockEnabled: true,
  strictMode: false,
  antiTracking: true,
  blockAnalytics: true,
  securityProtection: true,
  language: 'ru'
};

// Инициализация настроек при установке
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    adBlockEnabled: true,
    youtubeAdBlockEnabled: true,
    tiktokAdBlockEnabled: true,
    facebookAdBlockEnabled: true,
    strictMode: false,
    antiTracking: true,
    blockAnalytics: true,
    securityProtection: true,
    language: 'ru'
  });
  
  // Счётчики храним в local storage (быстрее и без квот)
  chrome.storage.local.get(['blockedAdsCount', 'blockedThreatsCount'], (data) => {
    blockedAdsCount = data.blockedAdsCount || 0;
    blockedThreatsCount = data.blockedThreatsCount || 0;
  });
  
  console.log('[Waveguard] Расширение установлено и активировано с защитой');
});

// Загружаем настройки при старте
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
], (data) => {
  settings.adBlockEnabled = data.adBlockEnabled !== false;
  settings.youtubeAdBlockEnabled = data.youtubeAdBlockEnabled !== false;
  settings.tiktokAdBlockEnabled = data.tiktokAdBlockEnabled !== false;
  settings.facebookAdBlockEnabled = data.facebookAdBlockEnabled !== false;
  settings.strictMode = data.strictMode || false;
  settings.antiTracking = data.antiTracking !== false;
  settings.blockAnalytics = data.blockAnalytics !== false;
  settings.securityProtection = data.securityProtection !== false;
  settings.language = data.language || 'ru';
});

// Загружаем счётчики при старте
chrome.storage.local.get(['blockedAdsCount', 'blockedThreatsCount'], (data) => {
  blockedAdsCount = data.blockedAdsCount || 0;
  blockedThreatsCount = data.blockedThreatsCount || 0;
});

// Слушаем изменения настроек для обновления кэша
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.adBlockEnabled) {
      settings.adBlockEnabled = changes.adBlockEnabled.newValue;
    }
    if (changes.youtubeAdBlockEnabled) {
      settings.youtubeAdBlockEnabled = changes.youtubeAdBlockEnabled.newValue;
    }
    if (changes.tiktokAdBlockEnabled) {
      settings.tiktokAdBlockEnabled = changes.tiktokAdBlockEnabled.newValue;
    }
    if (changes.facebookAdBlockEnabled) {
      settings.facebookAdBlockEnabled = changes.facebookAdBlockEnabled.newValue;
    }
    if (changes.strictMode) {
      settings.strictMode = changes.strictMode.newValue;
    }
    if (changes.antiTracking) {
      settings.antiTracking = changes.antiTracking.newValue;
    }
    if (changes.blockAnalytics) {
      settings.blockAnalytics = changes.blockAnalytics.newValue;
    }
    if (changes.securityProtection) {
      settings.securityProtection = changes.securityProtection.newValue;
    }
    if (changes.language) {
      settings.language = changes.language.newValue;
    }
  }
});

// Функция для сохранения счётчиков с задержкой (debounce)
function saveBlockedCount() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    chrome.storage.local.set({ 
      blockedAdsCount: blockedAdsCount,
      blockedThreatsCount: blockedThreatsCount
    });
  }, 1000); // Сохраняем не чаще раза в секунду
}

// Обработка сообщений от content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'adBlocked') {
    // Проверяем настройки из кэша (быстрее чем storage)
    if (settings.adBlockEnabled) {
      // Увеличиваем счетчик в памяти
      blockedAdsCount++;
      
      // Сохраняем с задержкой
      saveBlockedCount();
      
      // Отправляем текущее значение
      sendResponse({ success: true, count: blockedAdsCount });
    } else {
      sendResponse({ success: false });
    }
  } else if (request.action === 'threatBlocked') {
    // Угроза безопасности заблокирована
    if (settings.securityProtection) {
      blockedThreatsCount++;
      saveBlockedCount();
      
      console.log('[Waveguard Security] Угроза заблокирована:', request.threat);
      sendResponse({ success: true, threatsCount: blockedThreatsCount });
    } else {
      sendResponse({ success: false });
    }
  } else if (request.action === 'getBlockedCount') {
    // Запрос текущего значения счётчиков
    sendResponse({ 
      count: blockedAdsCount,
      threatsCount: blockedThreatsCount
    });
  } else if (request.action === 'resetBlockedCount') {
    // Сброс счётчиков
    blockedAdsCount = 0;
    blockedThreatsCount = 0;
    chrome.storage.local.set({ 
      blockedAdsCount: 0,
      blockedThreatsCount: 0
    });
    sendResponse({ success: true, count: 0, threatsCount: 0 });
  } else if (request.action === 'getSettings') {
    // Быстрый доступ к настройкам из кэша
    sendResponse({ settings: settings });
  }
  
  return true; // Необходимо для асинхронного ответа
});
