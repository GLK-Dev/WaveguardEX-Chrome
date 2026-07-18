# 🛡️ Waveguard Security - Security Documentation

## Introduction

Waveguard v4.0.0 includes a comprehensive threat protection system, providing an additional layer of security when working on the Internet.

## 🛡️ Security Features

### 1. Phishing Protection

**What is it?**  
Phishing - these are fraudulent sites that look like real ones (banks, PayPal, Google, etc.) and steal your data, passwords, and card numbers.

**How it works:**
- Real-time URL checking against a local list of known phishing domains
- Detection of suspicious subdomains and domains (e.g., paypal-secure.net, google-accounts-verify.com)
- Shows a full-screen red warning when attempting to open a phishing site
- Allows returning back or continuing at your own risk

**Examples of blocked domains:**
- *.phishing-site.com
- *.fake-bank.com
- *.secure-login-verify.com
- *.account-verification.net

### 2. Malware Protection

**What is it?**  
Malicious sites distribute malware, trojans, and other dangerous software that can infect your computer.

**How it works:**
- Blocking known domains distributing malware
- Preventing drive-by downloads (automatic downloads)
- Detecting exploit kits

**What is included:**
- Blocking malware hosts
- Checking suspicious downloads
- Warning about potentially dangerous content

### 3. Cryptojacking Protection

**What is it?**  
Cryptojacking - this is hidden cryptocurrency mining on your computer without your consent. It slows down the system and increases power consumption.

**How it works:**
- Blocking known cryptojacking scripts (CoinHive, JSEcoin, CryptoLoot, etc.)
- Intercepting the creation of Web Workers (used for mining)
- Blocking requests to mining pools

**Blocked mining services:**
`
❌ coinhive.com
❌ coin-hive.com
❌ jsecoin.com
❌ crypto-loot.com
❌ cryptoloot.pro
❌ webminepool.com
❌ monerominer.rocks
❌ minero.cc
❌ and many others...
`

### 4. PUP (Potentially Unwanted Programs) Protection

**What is it?**  
PUP - these are potentially unwanted programs installed without your consent: toolbars, adware, fake optimizers, driver updaters.

**How it works:**
- Blocking domains distributing PUPs
- Warning when attempting to download suspicious .exe/.msi files
- Detecting downloads with keywords: "setup", "installer", "toolbar", "optimizer"

**Tracked file types:**
- .exe, .msi - Windows installers
- .bat, .cmd - Command files
- .scr - Screensavers (often used for malware)
- .vbs, .js - Scripts

**Suspicious keywords:**
- download-manager
- toolbar-installer
- pc-cleaner
- system-optimizer
- driver-update

### 5. Aggressive Pop-up Protection

**How it works:**
- Limiting the number of pop-ups (maximum 2 per 5 seconds)
- Automatic blocking if the limit is exceeded
- Intercepting window.open() to prevent pop-up attacks

### 6. Anti-Clickjacking Protection

**What is it?**  
Clickjacking - this is an attack where an attacker overlays a transparent iframe, and you interact with an invisible element instead of the main page.

**How it works:**
- Detecting page loading in an invisible iframe
- Warning on clickjacking attempt
- Blocking the main page to prevent clicking

### 7. Suspicious Activity Monitoring

**Tracked:**
- Infinite redirects (malware sign)
- Automatic file downloads without user action
- Suspicious DOM manipulations

### 8. GenAI Data Protection (DLP)

**What is it?**  
Accidental leakage of Personally Identifiable Information (PII) like credit cards, phone numbers, or emails into AI chatbots (ChatGPT, Claude, etc.).

**How it works:**
- Real-time scanning of input fields and `contenteditable` elements on AI domains
- Automatically masks sensitive data before submission
- Uses a `TreeWalker` to preserve rich text HTML structure
- Shows a non-intrusive warning popup upon masking

### 9. Anti-Fingerprinting

**What is it?**  
Fingerprinting is a technique used by advertisers to track your device without cookies by analyzing hardware variations (Canvas drawing, WebGL rendering, Audio buffering).

**How it works:**
- Injects `anti-fingerprint.js` into the main page context
- Adds cryptographic noise to `HTMLCanvasElement.prototype.toDataURL` and `CanvasRenderingContext2D.prototype.getImageData`
- Spoofs WebGL parameters (`UNMASKED_VENDOR_WEBGL`)
- Normalizes `navigator.hardwareConcurrency` and `navigator.deviceMemory`

### 10. URL Tracking Remover

**What is it?**  
Advertisers often append tracking tags like `utm_source` or `fbclid` to links to track clicks across websites.

**How it works:**
- Intercepts page navigation early in the background
- Automatically removes known tracking parameters from the URL before the page loads
- Transparent to the user and preserves normal website functionality

## 📊 Statistics

The **"🛡️ Threats"** counter in the interface shows the number of blocked threats:
- Phishing sites
- Malicious domains
- Cryptojacking attempts
- PUP downloads
- Aggressive pop-ups

## ⚙️ Settings

### Enabling/Disabling Protection

1. Click on the Waveguard icon in the toolbar
2. Open **"⚙️ Advanced settings"**
3. Toggle **"🛡️ Anti-Phishing/Malware protection"**

### Controlled Settings

For maximum protection, ensure the following are enabled:
- ✅ Ad blocking on sites
- ✅ Ad blocking on YouTube
- ✅ Ad blocking on TikTok
- ✅ Ad blocking on Facebook/Meta
- ✅ Strict mode
- ✅ Anti-tracking
- ✅ Analytics blocking
- ✅ **Anti-Phishing/Malware protection** ⬅️ Important

## 🛑 Warnings

### Full-Screen Warning

When Waveguard detects a threat, a full-screen warning appears:

`
┌─────────────────────────────────┐
│         ⚠️ WARNING!           │
│                                 │
│  Phishing attempt detected!     │
│  This site may steal            │
│  your data.                     │
│                                 │
│  [Go Back]                      │
│  [Continue at my own risk]      │
└─────────────────────────────────┘
`

**Buttons:**
- **Go Back** - safe choice, returns to the previous page
- **Continue at my own risk** - hides the warning if you are sure

### Suspicious Download Warning

Upon a suspicious download attempt, a notification appears:

`
⚠️ Waveguard Security: 
Potentially unwanted program 
download attempt detected!

File: download.exe

Are you sure you want to continue?
`

## 🔒 Privacy

**Important:** All security checks occur **locally** on your device.

- ✅ Does not send data to external servers
- ✅ Does not collect browsing history
- ✅ Does not relay URLs to third-party services
- ✅ Works offline after the first download

The threat database (malicious-domains.json) is stored locally in the extension.

## 🗄️ Threat Database

### Categories

1. **Phishing** - 9+ patterns
2. **Malware** - 5+ patterns
3. **Cryptojacking** - 18+ domains
4. **PUP Domains** - 8+ patterns
5. **Suspicious TLDs** - 5 domain zones
6. **Scam Keywords** - 10+ keywords

### Database Update

The threat database is updated along with the extension. Automatic updating is planned in future versions.

## 🆚 Comparison with other solutions

| Feature | Waveguard Security | Chrome Safe Browsing | Malwarebytes BG |
|---------|-------------------|---------------------|-----------------|
| Ad Blocking | ✅ | ❌ | ❌ |
| Phishing Protection | ✅ | ✅ | ✅ |
| Malware Blocking | ✅ | ✅ | ✅ |
| Cryptojacking Protection | ✅ | ❌ | ✅ |
| PUP Blocking | ✅ | ❌ | ✅ |
| Pop-up Protection | ✅ | Partially | ❌ |
| Local Operation | ✅ | ✅ (Hashes) | Partially |
| Platform-specific | YouTube, TikTok, FB | N/A | All sites |

## 🛠️ How to report a false positive

If Waveguard blocked an incorrect site:

1. Click **"Continue at my own risk"**
2. Create an Issue: [GitHub Issues](https://github.com/GLK-Dev/WaveguardEX-Chrome/issues)
3. Temporarily disable protection for this site (in settings)

## 🧩 Interaction with other features

Waveguard Security works **together** with other features:

`
┌──────────────────────────────┐
│   Content Scripts Layer      │
├──────────────────────────────┤
│ 1. Security.js (Core)      │ ⬅️ URL checking
│ 2. Content.js (ads)          │ ⬅️ Ad blocking
│ 3. YouTube.js/TikTok.js/FB   │ ⬅️ Specific blocking
└──────────────────────────────┘
         ⬇
┌──────────────────────────────┐
│   Background Service Worker  │
├──────────────────────────────┤
│ 🔸 Declarative NetRequest     │
│ 🔸 Statistics (ads + threats) │
│ 🔸 Settings                  │
└──────────────────────────────┘
         ⬇
┌──────────────────────────────┐
│   Network Level              │
├──────────────────────────────┤
│ 🔸 rules.json (55 rules)     │
│ 🔸 Request level blocking  │
└──────────────────────────────┘
`

## 💻 Technical Details

### Architecture

- **Language:** JavaScript (ES6+)
- **API:** Chrome Extension Manifest V3
- **Patterns:** Observer + Factory
- **Storage:** chrome.storage.local (fast)

### Performance

- URL checking: **< 1ms**
- Threat database loading: **< 50ms**
- Impact on page speed: **Minimal**
- Memory consumption: **< 5MB**

### Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave 1.20+
- ✅ Opera 74+
- ⏳ Firefox (support in v5.1)

## 🚀 Future Plans

Planned in version 5.1:

- [ ] Automatic threat database updates
- [ ] Integration with Google Safe Browsing API
- [ ] White list of domains
- [ ] Export/import settings
- [ ] Detailed threat statistics by type
- [ ] Notifications about detected threats

## ❓ FAQ

**Q: Does Waveguard replace an antivirus?**  
A: No. Waveguard provides an additional layer of protection in the browser, but it does not replace a full-fledged antivirus.

**Q: Does it slow down the browser?**  
A: No. Checks occur locally in fractions of a millisecond.

**Q: Can I disable only security, leaving ad blocking?**  
A: Yes. In the advanced settings, there is a separate switch.

**Q: How often is the threat database updated?**  
A: Currently - with each version of the extension. Auto-updates are planned in v5.1.

**Q: Is it privacy-safe?**  
A: Yes. The extension does not collect or send your data. All work occurs locally.

## 📞 Contacts

- **GitHub:** https://github.com/GLK-Dev
- **Issues:** https://github.com/GLK-Dev/WaveguardEX-Chrome/issues
- **Author:** GLK Dev

---

**Waveguard v5.0.0 Privacy & Security Suite** 🛡️  
*Security for where we spend the most time - the Internet.*

