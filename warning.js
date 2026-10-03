// Interstitial shown by a declarativeNetRequest redirect: warning.html?t=<threat>&u=<original url>
(function() {
  'use strict';

  const MESSAGES = {
    phishing: 'Обнаружена попытка фишинговой атаки! Этот сайт может украсть ваши данные.',
    malware: 'Обнаружен вредоносный сайт! Этот сайт может заразить ваш компьютер.',
    cryptojacking: 'Обнаружен майнинг-скрипт! Этот сайт пытается использовать ваш процессор.',
    pup: 'Обнаружен сайт с ПНП! Может установить нежелательное ПО.',
    suspicious: 'Подозрительный домен! Будьте осторожны на этом сайте.',
    scam: 'Обнаружен возможный скам! Этот сайт может быть мошенническим.'
  };

  // u is last and unencoded (regexSubstitution inserts the raw URL), so take everything after "&u=".
  const search = location.search;
  const threatMatch = /[?&]t=([a-z_]+)/.exec(search);
  const threat = threatMatch ? threatMatch[1] : 'suspicious';
  const uIndex = search.indexOf('&u=');
  const target = uIndex === -1 ? '' : search.slice(uIndex + 3) + location.hash;

  let targetUrl = null;
  try {
    const parsed = new URL(target);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') targetUrl = parsed;
  } catch (e) {
    // Malformed target: proceed button stays disabled.
  }

  document.getElementById('message').textContent = MESSAGES[threat] || MESSAGES.suspicious;
  document.getElementById('url').textContent = targetUrl ? targetUrl.href : '(адрес недоступен)';

  chrome.runtime.sendMessage({ action: 'threatBlocked', threat });

  document.getElementById('back').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else window.close();
  });

  const proceed = document.getElementById('proceed');
  if (!targetUrl) proceed.disabled = true;
  proceed.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'allowDomain', host: targetUrl.hostname }, () => {
      location.replace(targetUrl.href);
    });
  });
})();
