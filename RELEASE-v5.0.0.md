# 🎉 Waveguard v5.0.0 - Next-Gen Privacy & Security Release Notes

## 🚀 What's New

Waveguard v5.0.0 is our biggest update yet, shifting from a simple ad-blocker to a complete privacy and next-gen security suite. We have added advanced heuristic engines, DLP protection for AI chatbots, and robust anti-tracking measures.

---

## 🛡️ New Next-Gen Features

### 1. 🤖 AI DOM-Analysis (Smart Ad Blocker)
**Problem:** Native ads and sponsored posts often bypass traditional domain filters.
**Solution:**
- Added a lightweight DOM heuristic scanner (`ai-dom-scanner.js`).
- Scans visible elements for ad-related keywords and structural patterns.
- Automatically hides obfuscated ads and sponsored content across all websites.

### 2. 🛡️ GenAI Data Protection (DLP)
**Problem:** Users accidentally leak PII (passwords, credit cards) into AI chatbots like ChatGPT or Claude.
**Solution:**
- Added `dlp.js` content script.
- Intercepts input fields on AI platforms.
- Masks sensitive data before it gets sent to the server.
- Shows a non-intrusive warning popup upon masking.

### 3. 🍪 Auto-Reject Cookie Banners
**Problem:** Annoying cookie consent popups disrupt browsing.
**Solution:**
- Added `cookie-banner.js`.
- Automatically clicks "Reject All" or hides cookie consent dialogs globally.

### 4. 🕵️‍♂️ Anti-Fingerprinting
**Problem:** Advertisers track you using Canvas, WebGL, and Audio hardware fingerprints.
**Solution:**
- Injected `anti-fingerprint.js` into the main page context.
- Adds random noise to Canvas and WebGL APIs.
- Normalizes hardware concurrency and device memory.
- Ensures you blend in with the crowd.

### 5. 🔗 URL Tracking Remover
**Problem:** Links shared online contain hidden tracking parameters (e.g., `utm_source`, `fbclid`).
**Solution:**
- Intercepts page navigations in `background.js`.
- Automatically strips tracking parameters from URLs before the page loads.

### 6. ⚡ Mini Mode (Performance Toggle)
**Problem:** Heavy DOM scripts can slow down older devices.
**Solution:**
- Added "Mini Mode" to the popup interface.
- Allows users to disable heavy DOM content scripts with one click, leaving only the blazing-fast network-level blocking active.

---

## 🌍 Global Expansion
- **Full English Translation:** All project documentation (`README.md`, `SECURITY.md`, etc.) has been fully translated into English.

## 🛠️ Technical Details
- Created 4 new standalone scripts to modularize features.
- Updated `manifest.json` to v5.0.0.
- All new features run locally with zero data sent to external servers.

**Enjoy a cleaner, safer, and more private web with Waveguard v5.0.0!** 🚀
