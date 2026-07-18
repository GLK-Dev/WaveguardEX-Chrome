// Локализация для Waveguard AdBlocker

const translations = {
  ru: {
    subtitle: 'Блокировщик рекламы',
    blocked: 'Заблокировано:',
    threatsBlocked: '🛡️ Угроз:',
    advancedSettings: '⚙️ Дополнительные настройки',
    blockWebsites: 'Блокировка рекламы на сайтах',
    blockYoutube: 'Блокировка рекламы на YouTube',
    blockTiktok: 'Блокировка рекламы на TikTok',
    blockFacebook: 'Блокировка рекламы на Facebook/Meta',
    advancedTitle: 'Расширенные функции',
    strictMode: 'Строгий режим (удаление элементов)',
    antiTracking: 'Защита от трекинга',
    blockAnalytics: 'Блокировка аналитики',
    securityProtection: '🛡️ Защита от фишинга/вредоносов',
    resetCounter: 'Сбросить счетчик',
    developedBy: 'Разработано'
  },
  uk: {
    subtitle: 'Блокувальник реклами',
    blocked: 'Заблоковано:',
    threatsBlocked: '🛡️ Загроз:',
    advancedSettings: '⚙️ Додаткові налаштування',
    blockWebsites: 'Блокування реклами на сайтах',
    blockYoutube: 'Блокування реклами на YouTube',
    blockTiktok: 'Блокування реклами на TikTok',
    blockFacebook: 'Блокування реклами на Facebook/Meta',
    advancedTitle: 'Розширені функції',
    strictMode: 'Суворий режим (видалення елементів)',
    antiTracking: 'Захист від відстеження',
    blockAnalytics: 'Блокування аналітики',
    securityProtection: '🛡️ Захист від фішингу/шкідників',
    resetCounter: 'Скинути лічильник',
    developedBy: 'Розроблено'
  },
  en: {
    subtitle: 'Ad Blocker',
    blocked: 'Blocked:',
    threatsBlocked: '🛡️ Threats:',
    advancedSettings: '⚙️ Advanced Settings',
    blockWebsites: 'Block ads on websites',
    blockYoutube: 'Block ads on YouTube',
    blockTiktok: 'Block ads on TikTok',
    blockFacebook: 'Block ads on Facebook/Meta',
    advancedTitle: 'Advanced Features',
    strictMode: 'Strict mode (remove elements)',
    antiTracking: 'Anti-tracking protection',
    blockAnalytics: 'Block analytics',
    securityProtection: '🛡️ Phishing/Malware protection',
    resetCounter: 'Reset Counter',
    developedBy: 'Developed by'
  },
  he: {
    subtitle: 'חוסם פרסומות',
    blocked: 'נחסמו:',
    threatsBlocked: '🛡️ איומים:',
    advancedSettings: '⚙️ הגדרות מתקדמות',
    blockWebsites: 'חסימת פרסומות באתרים',
    blockYoutube: 'חסימת פרסומות ב-YouTube',
    blockTiktok: 'חסימת פרסומות ב-TikTok',
    blockFacebook: 'חסימת פרסומות ב-Facebook/Meta',
    advancedTitle: 'תכונות מתקדמות',
    strictMode: 'מצב קפדני (הסרת אלמנטים)',
    antiTracking: 'הגנה מפני מעקב',
    blockAnalytics: 'חסימת אנליטיקה',
    securityProtection: '🛡️ הגנה מפני דיוג/תוכנות זדוניות',
    resetCounter: 'איפוס מונה',
    developedBy: 'פותח על ידי'
  },
  es: {
    subtitle: 'Bloqueador de anuncios',
    blocked: 'Bloqueado:',
    threatsBlocked: '🛡️ Amenazas:',
    advancedSettings: '⚙️ Configuración avanzada',
    blockWebsites: 'Bloquear anuncios en sitios web',
    blockYoutube: 'Bloquear anuncios en YouTube',
    blockTiktok: 'Bloquear anuncios en TikTok',
    blockFacebook: 'Bloquear anuncios en Facebook/Meta',
    advancedTitle: 'Funciones avanzadas',
    strictMode: 'Modo estricto (eliminar elementos)',
    antiTracking: 'Protección anti-rastreo',
    blockAnalytics: 'Bloquear analítica',
    securityProtection: '🛡️ Protección contra phishing/malware',
    resetCounter: 'Restablecer contador',
    developedBy: 'Desarrollado por'
  }
};

// Функция для применения перевода
function applyTranslations(lang) {
  const trans = translations[lang] || translations['en'];
  
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (trans[key]) {
      element.textContent = trans[key];
    }
  });
  
  // Применяем RTL для иврита
  if (lang === 'he') {
    document.body.setAttribute('dir', 'rtl');
  } else {
    document.body.setAttribute('dir', 'ltr');
  }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations, applyTranslations };
}
