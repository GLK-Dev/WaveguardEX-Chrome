# Waveguard AdBlocker Installation Guide

## Step 1: Preparing Icons (Optional)

Icons are not required for the extension to work, but if you want to install them:

1. Open icons/generate-icons.html in your Chrome browser
2. Click the buttons "Generate 16x16", "Generate 48x48", "Generate 128x128"
3. Save the downloaded files to the icons/ folder

**OR** just create 3 blank PNG images with any content and name them:
- icon16.png
- icon48.png
- icon128.png

## Step 2: Installation in Chrome

1. Open Chrome
2. Go to the page: chrome://extensions/
3. Enable **"Developer mode"** (toggle in the top right corner)
4. Click the **"Load unpacked"** button
5. Select the folder E:\VSCode projects\Waveguard\WaveguardEX-Chrome
6. Done! The extension is installed

## Step 3: Checking Operation

1. Find the extension icon in the Chrome toolbar (top right)
2. Click on the icon - the control panel will open
3. Ensure all switches are enabled (blue)
4. Open YouTube and try watching a video with ads

## Troubleshooting

### Error "Manifest file is missing or unreadable"
- Make sure you selected the correct folder with the manifest.json file

### Error with icons
- If there are no PNG icons, temporarily delete the block with icons from manifest.json:
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
},

### The extension is not blocking ads
- Check if the switches are enabled in the popup menu
- Reload the page after installing the extension
- Check the developer console (F12) for errors

## Updating the Extension

After changing the code:
1. Go to chrome://extensions/
2. Click the update button (circular arrow) for the Waveguard extension
3. Reload open tabs

## Removal

1. Go to chrome://extensions/
2. Find Waveguard AdBlocker
3. Click "Remove"

---

**Note**: This extension is for personal use. Complex sites might not work correctly with ad blockers enabled.
