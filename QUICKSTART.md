# 🚀 Quick Start - Waveguard AdBlocker

The Chrome extension is ready! You just need to create icons and load it into the browser.

## 🎨 Step 1: Create Icons (2 minutes)

1. **Open the file** create-icons.html in Chrome:
   - Find the file in the project folder
   - Right-click -> "Open with" -> Chrome

2. **Download icons**:
   - Click the button "⬇️ Download all"
   - Save the 3 files: icon16.png, icon48.png, icon128.png

3. **Move icons**:
   - Move all 3 PNG files to the icons/ folder of the project

## 📥 Step 2: Installation in Chrome (1 minute)

1. Open Chrome and type in the address bar:
   chrome://extensions/

2. **Enable "Developer mode"** (toggle top right)

3. **Click "Load unpacked"**

4. **Select the project folder**: E:\VSCode projects\Waveguard\WaveguardEX-Chrome

5. **Done!** The extension is installed 🎉

## 🎮 Step 3: Usage

1. **Find the icon** of the extension in the Chrome toolbar (top right)

2. **Click on the icon** - the control panel will open

3. **Check operation**:
   - Open any site with ads
   - Open YouTube and try watching a video
   - The counter in the popup will show the number of blocked ads

## 🔧 Alternative: Installation without icons

If you don't want to mess with icons, just temporarily disable them:

1. Open manifest.json
2. Remove the entire "icons" section (lines 5-9)
3. Remove "default_icon" in the "action" section (lines 30-34)
4. Save the file and load the extension in Chrome

The extension will work with the default Chrome icon.

## 🌟 What the extension can do

🚫 **Block ads on all sites**:
- Google AdSense
- Yandex.Direct
- Banners and pop-up windows
- Teaser networks

📺 **Block ads on YouTube**:
- Automatically skips video ads
- Speeds up unskippable videos by 16x
- Hides ad banners and overlays
- Works upon page navigation

🎛️ **Control interface**:
- Separate enable/disable for sites and YouTube
- Blocked ads counter
- Clear statistics

## 🔍 Operation Check

### On a regular site:
1. Open a news site or blog
2. Banners should disappear
3. Check the counter in the extension popup

### On YouTube:
1. Open any video with ads
2. The ad should be automatically skipped
3. Banners over the video should disappear

## 🛠️ Troubleshooting

### Extension won't load
- **Problem**: "Manifest file is missing"
- **Solution**: Make sure you selected the Waveguard folder where manifest.json is located

### Error with icons
- **Problem**: "Could not load icon"
- **Solution**: Either create the icons or remove the section with icons from manifest.json

### Ads are not blocked
- **Problem**: Banners are still displayed
- **Solution**: 
  - Check if the switch is enabled in the popup
  - Reload the page (Ctrl+R or F5)
  - Check the console (F12) for errors

### YouTube ads are not skipped
- **Problem**: Ads on YouTube don't skip
- **Solution**: 
  - Make sure the YouTube switch is enabled (blue)
  - Reload the YouTube page
  - Wait 1-2 seconds - the script needs time to activate

## 🔄 Updating the extension

After changing the code:
1. Go to chrome://extensions/
2. Find Waveguard AdBlocker
3. Click the update button (🔄)
4. Reload open tabs

## 📚 Additional Information

- **Full documentation**: see README.md
- **Installation guide**: see INSTALL.md
- **Icon generation**: open create-icons.html in browser

## 🔒 Privacy

- ✅ Works completely locally
- ✅ Does not collect user data
- ✅ Does not send information to servers
- ✅ Open source code

---

**Done! Enjoy an ad-free internet! 🎉**

If you have questions, check README.md or INSTALL.md for more information.

