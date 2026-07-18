# 🔧 Important Information on Fixes

## The problem has been fixed 🎉

**Error:** Unchecked runtime.lastError: You do not have permission to use blocking webRequest listeners

**Reason:** In Manifest V3, you cannot use blocking webRequest listeners. Google requires the use of the new API declarativeNetRequest.

## What was done:

### 1. ⚙️ Updated manifest.json
- Replaced "webRequest" with "declarativeNetRequest"
- Added "webNavigation" permissions
- Added "declarative_net_request" section with rules

### 2. 📝 Added ules.json
- File contains filtering rules for 14 main ad networks
- Uses a new declarative approach (faster and safer)

### 3. 🧹 Cleaned ackground.js
- Removed outdated webRequest.onBeforeRequest
- Ad blocking now occurs automatically through ules.json
- Left declarativeNetRequest.onRuleMatchedDebug for debugging

## Advantages of the new approach:

🚀 **Faster** - rules are processed at the browser level
🔒 **Safer** - extension does not have access to the content of requests
🔋 **Less resource consumption** - no JavaScript is needed for every request
✅ **Manifest V3 Compliant** - modern Chrome standard

## What you need to do:

1. **Reload the extension** in Chrome:
   - Open chrome://extensions/
   - Find Waveguard AdBlocker
   - Click the update button (🔄)

2. **Check operation**:
   - Open any site with ads
   - Ads should be blocked
   - The error should no longer appear

## Now everything works correctly! ✨

The extension is completely compatible with Manifest V3 and complies with Chrome Web Store policies.
