# Waveguard Security

Security model of Waveguard AdBlocker **5.1.0**: what it protects against, how, and where the limits are.

## Protections

### Known malicious sites (phishing, malware)
- `background.js` turns `malicious-domains.json` into dynamic `declarativeNetRequest` redirect rules (`requestDomains`, subdomains included).
- A top-level navigation to a listed host is redirected **before any request is made** to `warning.html?t=<threat>&u=<url>`.
- "Proceed on my risk" adds a **session** allow rule for that host. Only the warning page itself may request this (the sender URL is verified); the rule disappears when the browser closes.
- Additional regex rules flag suspicious TLDs (`.tk`, `.ml`, `.ga`, `.cf`, `.gq`) and scam keywords in the host/path. Search queries are ignored to avoid false alarms.
- Data sources and freshness: see [README](README.md#threat-data). The list is a snapshot; it does not replace Safe Browsing.

### Cryptojacking
- Ruleset `miners` blocks known miner hosts (scripts, XHR, frames, WebSockets).
- `page-guard.js` (MAIN world) rejects `Worker` URLs matching miner patterns and traps `CoinHive`-style globals.

### Pop-ups
- `page-guard.js` allows two `window.open` calls per 5 seconds and returns `null` for the rest. It runs in the page's real JavaScript context (manifest `"world": "MAIN"`); patches in the isolated content-script world would not affect the page.

### Risky downloads
- `security.js` asks for confirmation when a clicked link points to an executable-type file (`.exe`, `.msi`, `.bat`, `.cmd`, `.scr`, `.pif`, `.vbs`, `.jar`, `.dmg`) **and** its path contains adware-style words (`setup`, `installer`, `codec`, `toolbar`, ...).

### GenAI data loss prevention
- Masks Luhn-valid card numbers, e-mails and phone numbers in AI chat inputs on ChatGPT, Claude, Copilot, Gemini, Perplexity, Grok, DeepSeek and Mistral.
- Text still being typed is only masked once it is no longer at the end of the field, or on Enter / focus loss / form submit, so partially typed numbers are not mangled.
- Pasted text is masked before insertion. Processing happens in the page, in memory; nothing is stored or sent.
- Not covered: file uploads, voice input, text typed into iframes of other origins.

### Anti-fingerprinting
- Canvas (`toDataURL`, `toBlob`, `getImageData`) and offline-audio results get tiny seeded noise: stable within a page, different between sessions. The on-screen canvas is never altered.
- `navigator.hardwareConcurrency` / `deviceMemory` report common values.
- Not covered: WebGL parameters, fonts, screen metrics, Workers. This reduces, not removes, fingerprinting surface.

### Tracking
- Rulesets `trackers` and `tracking_params` block common tracker requests and strip tracking query parameters via DNR (no tab reloads).

## Permissions

| Permission | Why |
|---|---|
| `storage` | Settings (`sync`) and counters (`local`) |
| `declarativeNetRequest` | Ad/tracker/miner blocking, warning redirects, parameter stripping |
| `alarms` | Periodic reconnect to Waveguard Desktop (survives service-worker shutdown) |
| Host access `<all_urls>` | Content scripts for cosmetic filtering, anti-fingerprinting, cookie banners |

Only `warning.html` is web-accessible, so websites cannot read the threat list or fingerprint the extension through other resources.

## Waveguard Desktop link

The service worker connects to `ws://127.0.0.1:18765`. The Desktop server accepts only `Origin: chrome-extension://...`, limits messages to 64 KB and validates SHA-256 hashes. There is no shared secret yet, so other local processes can still connect; treat the channel as local-trust only.

## Privacy

No telemetry, no developer servers. See [PRIVACY.md](PRIVACY.md).

## Known limitations

- Threat data is a periodic snapshot (phishing sites change within hours).
- Domain-level blocking cannot distinguish a hacked legitimate site from a dedicated one; the feed updater only keeps dedicated phishing hosts, and the warning page always allows proceeding.
- Heuristic features (strict mode, cookie banners, ad hiding on social sites) can mis-hide content. Turn the feature off in the popup if a page breaks.

## Reporting issues

False positives and vulnerabilities: https://github.com/GLK-Dev/WaveguardEX-Chrome/issues (for vulnerabilities, please describe the impact without publishing exploit details first).

## Testing

`npm test` (unit) and `npm run e2e` (Chromium with the extension loaded) cover the warning redirect, allow-rule, rulesets, parameter stripping, ad blocking and DLP.
