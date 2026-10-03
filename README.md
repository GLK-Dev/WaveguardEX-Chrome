# Waveguard AdBlocker

Manifest V3 Chrome extension that blocks ads and trackers, warns about known malicious sites, reduces browser fingerprinting and masks sensitive data typed into AI chats. Optional companion app: [WaveguardDesktop](../WaveguardDesktop) (on-demand file scanner and quarantine).

Current version: **5.1.0** (requires Chrome 120+). See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Features

| Area | What it does | How |
|---|---|---|
| Ads | Blocks ad-network requests; hides ad elements | `declarativeNetRequest` ruleset `ads`; cosmetic content scripts |
| YouTube / TikTok / Facebook & Instagram | Skips or hides ads and sponsored posts | Dedicated content scripts (DOM based, may need updates when the sites change) |
| Trackers & analytics | Blocks common tracker requests | Ruleset `trackers` (toggle: *Block analytics*) |
| Tracking parameters | Strips `utm_*`, `fbclid`, `gclid`, ... from page URLs | DNR `queryTransform`, no tab reloads (toggle: *Anti-tracking*) |
| Malicious sites | Full-page warning *before* the site loads; "proceed anyway" is allowed per host for the session | Dynamic DNR redirect rules built from `malicious-domains.json` |
| Cryptojacking | Blocks known miner hosts and Worker URLs | Ruleset `miners` + page guard |
| Pop-ups | Limits rapid `window.open` bursts | MAIN-world page guard |
| Risky downloads | Asks before following links to executables that look like adware installers | Content script |
| Anti-fingerprinting | Seeded noise for canvas and audio, normalised `hardwareConcurrency` / `deviceMemory` | MAIN-world script; never modifies the visible canvas |
| GenAI DLP | Masks card numbers (Luhn-checked), e-mails and phone numbers typed or pasted into ChatGPT, Claude, Copilot, Gemini, Perplexity, Grok, DeepSeek, Mistral | Content script |
| Cookie banners | Clicks "reject" or hides common consent banners | Content script |
| Strict mode | Extra heuristic that hides unlabeled "Sponsored"/"Ad" blocks (off by default, can over-hide) | Content script |

UI languages: RU, UK, EN, HE, ES.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** and select the `WaveguardEX-Chrome` folder.

## Threat data

`malicious-domains.json` is a snapshot refreshed by the developer, not at runtime:

```
npm run update-threats
```

| Category | Source | Notes |
|---|---|---|
| `malware` | [abuse.ch URLhaus](https://urlhaus.abuse.ch/api/) host file (CC0) | Hosts currently serving malware |
| `phishing` | [OpenPhish community feed](https://openphish.com/terms.html) | Non-commercial use only; only dedicated phishing hosts (path `/`) |
| `cryptojacking`, `suspicious_tlds`, `scam_keywords` | Hand-maintained | |
| `pup_domains` | none | No reliable public feed; intentionally empty |

Phishing domains live for hours to days, so a snapshot ages quickly. Re-run the updater before each release.

## Development

```
npm test        # unit tests (DLP logic, manifest and ruleset integrity)
npm run e2e     # real Chromium with the extension loaded (needs: npx playwright install chromium)
```

The E2E run checks: enabled rulesets, warning redirect for malware and phishing hosts, "proceed" allow-rule, tracking-parameter stripping, ad request blocking, the ad-block toggle, and DLP in a textarea and a contenteditable.

### Layout

```
manifest.json            MV3 manifest
background.js            Service worker: settings -> rulesets, threat rules, counters, Desktop link (stateless)
rules/                   Static DNR rulesets: ads, trackers, miners, tracking-params
malicious-domains.json   Threat snapshot (see above)
warning.html / .js       Interstitial for blocked sites
page-guard*.js           MAIN-world pop-up / miner guard + bridge to extension APIs
anti-fingerprint.js      MAIN-world fingerprint protection
dlp-core.js / dlp.js     GenAI DLP (pure logic + DOM glue)
content.js, youtube.js, tiktok.js, facebook.js, cookie-banner.js, ai-dom-scanner.js, security.js
popup.html / .js / .css, i18n.js
tools/update-threats.mjs Threat snapshot updater
tests/                   Unit tests and E2E script
```

## Limitations

- MV3 filtering is declarative: rule counts are limited and rules update only with the extension (or via dynamic rules).
- YouTube, TikTok and Facebook ad hiding relies on page structure and can break when those sites change; YouTube may also serve ads inside the video stream, which this extension cannot remove.
- Do not run it together with another content blocker.

## Changelog

- **5.1.0** - Rulesets rewritten to anchored `||domain^` filters and split by feature; warning interstitial before page load; stateless service worker; MAIN-world anti-fingerprinting with stable noise; DLP rewritten (Luhn, paste handling, React-safe); real malware/phishing feeds; permissions reduced to `storage`, `declarativeNetRequest`, `alarms`; fixes for Facebook feed removal and TikTok/Facebook observers; E2E tests.
- **5.0.x** - Privacy suite (DLP, anti-fingerprinting, cookie banners), YouTube/ad-blocker false-positive fixes.
- **4.0.0** - Security edition (see [RELEASE-v4.0.0.md](RELEASE-v4.0.0.md)).
