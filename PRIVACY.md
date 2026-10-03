# Политика конфиденциальности Waveguard / Privacy Policy

## Кратко
Waveguard не собирает, не передаёт и не продаёт данные о вас. Расширение не обращается к серверам разработчика и не содержит аналитики или телеметрии.

## Какие данные обрабатываются и где
| Данные | Зачем | Где хранится |
|---|---|---|
| Настройки (переключатели, язык) | Работа расширения | `chrome.storage.sync` (синхронизируется вашим аккаунтом Chrome) |
| Счётчики заблокированных рекламы и угроз | Показ в окне расширения | `chrome.storage.local`, только на вашем устройстве |
| Адреса посещаемых страниц | Проверка по списку вредоносных доменов и редирект на страницу предупреждения | Обрабатываются браузером (declarativeNetRequest) локально, не сохраняются и не отправляются |
| Текст в полях ввода ИИ-чатов | Маскирование номеров карт, e-mail и телефонов (DLP) | Обрабатывается в памяти страницы, не сохраняется и не отправляется |
| Хеши загруженных файлов (если запущено Waveguard Desktop) | Сверка с локальной базой сигнатур | Передаются только на `127.0.0.1:18765`, то есть на ваш компьютер |

## Разрешения
- `storage` — настройки и счётчики.
- `declarativeNetRequest` — блокировка рекламы, трекеров, майнеров и перенаправление на предупреждение.
- `alarms` — периодическое переподключение к Waveguard Desktop.
- Доступ ко всем сайтам (`<all_urls>`) — блокировка рекламных элементов на странице, защита от слежки (anti-fingerprint), скрытие баннеров cookie. Содержимое страниц не покидает ваш браузер.

## Сторонние данные
Список вредоносных узлов в `malicious-domains.json` обновляется разработчиком при выпуске версии из открытого списка abuse.ch URLhaus (CC0). Расширение само ничего не скачивает во время работы.

Использование информации соответствует Chrome Web Store User Data Policy, включая требования Limited Use.

## Контакты
Вопросы и обращения: https://github.com/GLK-Dev/WaveguardEX-Chrome/issues

---

# English summary
Waveguard collects, transmits and sells no user data and has no telemetry. Settings live in `chrome.storage.sync`, counters in `chrome.storage.local`. Page URLs are matched against the local threat list by the browser itself; text typed into AI chats is masked in memory only. Hash lookups go to Waveguard Desktop on `127.0.0.1` exclusively. The threat list is refreshed by the developer from the abuse.ch URLhaus feed (CC0) at release time. The use of information adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.
