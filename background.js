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
  } else if (request.action === 'getDesktopStatus') {
    const isConnected = desktopSocket && desktopSocket.readyState === WebSocket.OPEN;
    sendResponse({ connected: isConnected });
  }
  
  return true; // Необходимо для асинхронного ответа
});


// --- Waveguard URL Tracking Remover ---
const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'zanpid',
  'msclkid', 'mc_eid', '_bta_tid', '_bta_c', 'igshid', '_hsenc', '_hsmi'
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    try {
      const url = new URL(changeInfo.url);
      let paramsRemoved = false;
      
      TRACKING_PARAMS.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          paramsRemoved = true;
        }
      });
      
      if (paramsRemoved) {
        chrome.tabs.update(tabId, { url: url.toString() });
      }
    } catch (e) {
      // Invalid URL
    }
  }
});
// --------------------------------------

// --- WAVEGUARD DESKTOP INTEGRATION (WEBSOCKETS) ---
let desktopSocket = null;
let reconnectTimer = null;

function connectToDesktop() {
  if (desktopSocket && (desktopSocket.readyState === WebSocket.OPEN || desktopSocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  console.log("Connecting to WaveguardDesktop WebSocket...");
  desktopSocket = new WebSocket("ws://127.0.0.1:18765");

  desktopSocket.onopen = () => {
    console.log("Successfully connected to WaveguardDesktop!");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  desktopSocket.onmessage = (event) => {
    console.log("Received message from WaveguardDesktop:", event.data);
  };

  desktopSocket.onclose = () => {
    console.warn("Disconnected from WaveguardDesktop. Retrying in 5s...");
    desktopSocket = null;
    reconnectTimer = setTimeout(connectToDesktop, 5000);
  };

  desktopSocket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
}

// Initial connection attempt
connectToDesktop();

// Listen for messages from content scripts to forward to Desktop
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_FILE_HASH' || message.type === 'DOM_THREAT_REPORT') {
    if (desktopSocket && desktopSocket.readyState === WebSocket.OPEN) {
      desktopSocket.send(JSON.stringify({
        type: message.type,
        data: message.payload,
        tabId: sender.tab ? sender.tab.id : null
      }));
      sendResponse({ status: "sent_to_desktop" });
    } else {
      sendResponse({ status: "desktop_disconnected" });
    }
  }
  return true;
});

