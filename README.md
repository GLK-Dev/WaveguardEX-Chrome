# Waveguard AdBlocker 🛡️ Privacy & Security Suite

A powerful extension for Chrome that blocks ads **and protects against cyber threats**: phishing, malicious sites, cryptojacking, and potentially unwanted programs (PUPs).

## 🚀 Key Features

### Ad Blocking
- 🚫 **Ad blocking on all sites** - removes banners, pop-up ads, and video ads
- 📺 **Ad blocking on YouTube** - automatically skips video ads and hides ad banners
- 🎵 **Ad blocking on TikTok** - removes ads from the feed and skips ad posts
- 📱 **Ad blocking on Facebook/Instagram** - hides sponsored posts and Stories

### 🚀 Advanced Privacy & Next-Gen Security (New in v5.0!)
- 🤖 **AI DOM-Analysis** - Smart heuristic blocker for native ads and sponsored content
- 🛡️ **GenAI Data Protection (DLP)** - Masks sensitive data (PII) before sending to AI chatbots (ChatGPT, Claude)
- 🍪 **Auto-Reject Cookie Banners** - Automatically clicks "Reject All" or hides cookie consent popups
- 🕵️‍♂️ **Anti-Fingerprinting** - Anonymizes Canvas, WebGL, and Audio API fingerprints
- 🔗 **URL Tracking Remover** - Automatically strips tracking tags (UTM, fbclid) from URLs
- ⚡ **Mini Mode** - Toggle to disable heavy DOM scripts for maximum performance
### 🛡️ Threat Protection (v4.0)
- 🎣 **Anti-Phishing** - blocks fake banking sites, stealing passwords
- ☠️ **Anti-Malware** - prevents drive-by downloads of malware
- ⛏️ **Anti-Cryptojacking** - blocks hidden mining scripts
- 🕷️ **PUP Blocking** - prevents download of potentially unwanted programs
- 🛑 **Pop-up Blocking** - aggressive blocking of pop-up windows
- 🖱️ **Anti-Clickjacking** - prevents invisible frames

### Convenience
- 🌍 **Multilingual** - interface in 5 languages (RU, UK, EN, HE, ES)
- 📊 **Counter** - tracking of blocked ads and threats
- 🎛️ **Simple interface** - convenient control via popup menu
- ⚙️ **Detailed settings** - flexible configuration for each function

## 📥 Installation

### Method 1: Loading in Developer Mode

1. Download or clone this repository
2. Open Chrome and go to the page chrome://extensions/
3. Enable **Developer mode** (toggle in the top right corner)
4. Click **Load unpacked**
5. Select the folder with the Waveguard extension
6. Done! The extension is installed and active

## 💻 Usage

1. After installation, the extension icon will appear in the Chrome toolbar
2. Click on the icon to open the control panel
3. Toggle the switches:
   - Enable/disable ad blocking on regular sites
   - Enable/disable ad blocking on YouTube
   - View the counter of blocked ads

### Automatic Operation

The extension works automatically:
- On regular sites, it removes video ads, banners, and pop-up ads
- On YouTube, it automatically skips video ads and hides ad banners
- Blocks tracking and third-party advertising cookies

## 🛠️ Technical Details

### Project Structure

`
Waveguard/
├── manifest.json              # Extension manifest (Manifest V3)
├── rules.json                 # 55+ blocking rules (declarativeNetRequest)
├── malicious-domains.json     # Threat database (phishing, malware, pup)
├── background.js              # Service Worker
├── content.js                 # General ad blocking
├── security.js                # 🛡️ Security engine (New)
├── youtube.js                 # Script for YouTube
├── tiktok.js                  # Script for TikTok
├── facebook.js                # Script for Facebook/Instagram
├── popup.html/css/js          # Control interface
├── i18n.js                    # Multilingual support (5 languages)
├── icons/                     # Extension icons
└── docs/
    ├── README.md
    ├── SECURITY.md            # 🛡️ Security Documentation
    ├── INSTALL.md
    └── QUICKSTART.md
`

### Principle of Operation

1. **Background Service Worker** (ackground.js)
   - Blocks HTTP requests to ad networks (Google Ads, DoubleClick, Yandex Ads, etc.)
   - Keeps statistics of blocked ads

2. **Content Scripts**
   - content.js - removes ad elements on all sites via CSS selectors
   - youtube.js - specialized script for YouTube, which:
     - Automatically clicks the "Skip Ad" button
     - Speeds up unskippable ads
     - Hides ad banners and overlays

3. **Popup Interface**
   - Shows statistics of blocked ads
   - Allows controlling extension features

## 🎯 Functions

### Blocked Ad Types

- Google AdSense & DoubleClick
- Yandex.Direct
- Banners and pop-up windows
- Video ads on YouTube
- Text overlays
- Sponsored content
- Teaser networks (Taboola, Outbrain, Criteo, etc.)

### 🛡️ Blocked Threats

**Phishing:**
- Fake banking sites
- Fake login pages (PayPal, Google, Apple, etc.)
- Fraudulent verification pages

**Malware:**
- Malware hosts
- Drive-by downloads
- Exploit kits

**Cryptojacking (Hidden miners):**
- CoinHive, JSEcoin, CryptoLoot
- WebMinePool, MoneroMiner
- And other web miners

**PUPs (Potentially Unwanted Programs):**
- Toolbars and adware
- Fake optimizers
- Driver updaters
- Download managers

**Suspicious Zones:**
- .tk, .ml, .ga, .cf, .gq zones
- Scam domains (win-prize, free-iphone, etc.)

### YouTube Blocking Features

- ⚡ Instant ad skipping
- ⏩ Speeding up unskippable videos by 16x
- 🧹 Removing banners and overlays
- 🔄 Works on page navigation (SPA)
- 🛡️ Ignores all types of YouTube ads

## ⚙️ Settings

### Main Settings
- dBlockEnabled - Ad blocking on regular sites
- youtubeAdBlockEnabled - Ad blocking on YouTube
- 	iktokAdBlockEnabled - Ad blocking on TikTok
- acebookAdBlockEnabled - Ad blocking on Facebook/Meta

### Advanced Settings
- strictMode - Strict mode (element removal)
- ntiTracking - Anti-tracking protection
- lockAnalytics - Analytics blocking
- securityProtection - 🛡️ **Anti-Phishing/Malware protection**
- language - UI Language (ru/uk/en/he/es)

### Statistics
- lockedAdsCount - Number of blocked ads
- lockedThreatsCount - 🛡️ **Number of blocked threats**

## 📚 Documentation

- **[SECURITY.md](SECURITY.md)** - 🛡️ Detailed documentation on security features
- **[INSTALL.md](INSTALL.md)** - Installation instructions
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide

## 🔒 Security and Privacy

- ✅ **Local operation** - all checks occur on your device
- ✅ **No data collection** - we do not send statistics to servers
- ✅ **No tracking** - we do not collect browsing history
- ✅ **Open source code** - code is available for review
- ✅ **Manifest V3** - modern Chrome security standard

## 🆚 Why Waveguard?

| Feature | Waveguard v5.0 | AdBlock Plus | uBlock Origin |
|---------|---------------|--------------|---------------|
| Ad Blocking | ✅ | ✅ | ✅ |
| YouTube Skipping | ✅ | Partially | Partially |
| TikTok/Facebook | ✅ | ❌ | ❌ |
| Anti-Phishing | ✅ | ❌ | ❌ |
| Anti-Malware | ✅ | ❌ | ❌ |
| Anti-Cryptojacking| ✅ | Partially | ✅ |
| PUP Blocking | ✅ | ❌ | ❌ |
| Multilingual | 5 languages | 40+ | 20+ |
| Threat Counter | ✅ | ❌ | ❌ |
| Local Operation | ✅ | ✅ | ✅ |

## 👨‍💻 Development

### Requirements

- Google Chrome 88+ (or Chromium-based browser)
- Basic knowledge of JavaScript ES6+, HTML5, CSS3
- Understanding of Chrome Extension Manifest V3

### Modification

You can easily configure the extension for your needs:

1. **Add domains to block** - edit the dDomains array in ackground.js
2. **Add CSS selectors** - edit the dSelectors array in content.js or youtube.js
3. **Change interface** - edit popup.html and popup.css

### Debugging

1. Open chrome://extensions/
2. Find Waveguard AdBlocker
3. Click "Details" -> "Inspect views: service worker"
4. Use Console for debugging

## 📌 Notes

- The extension uses Manifest V3 (the latest standard for Chrome)
- Works completely locally, does not send data to external servers
- Does not require creating an account or registration
- Completely free and open-source

## ⚠️ Limitations

- Some sites can detect ad blockers
- YouTube may periodically update the page layout, which will require updating the selectors
- Works only in Chromium-based browsers (Chrome, Edge, Opera, etc.)

## 🛡️ Privacy

The extension:
- ❌ Does not collect personal data
- ❌ Does not track user activity
- ✅ Works completely locally
- ✅ Does not require access to accounts

## 📄 License

MIT License - free to use and modify the code.

## 🤝 Contribution to the project

Pull requests with improvements are welcome:
- New ad domains to block
- Better selectors
- Bug fixes
- Interface improvements

## 🐛 Known Issues

- On some sites, ads can load dynamically and bypass
- YouTube may periodically change the selectors of ad elements

## 📞 Support

If you find a bug or have a suggestion, create an Issue in the repository.

---

**Made with ❤️ for a free Internet without ads**

