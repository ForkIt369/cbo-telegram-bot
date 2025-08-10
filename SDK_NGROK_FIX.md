# SDK Bot Ngrok Error Resolution

## Problem Analysis

The SDK bot mini app shows error: "ERR_NGROK_3200 - The endpoint a609-71-105-10-45.ngrok-free.app is offline"

### Root Causes Identified:

1. **Cached ngrok URL**: The Telegram app has cached an old ngrok development URL
2. **Menu Button Issue**: Both bots' menu buttons keep reverting to "commands" type instead of "web_app"
3. **Bot Configuration**: The bots may need to be reconfigured through @BotFather

## Fixes Applied

### 1. SDK App Code Fixed ✅
- Changed API endpoints from `/sdk/api` to `/api`
- Fixed production detection to exclude ngrok URLs
- Added proper API client override for production
- Files modified:
  - `ClaudeBROSDK/src/js/simple-api.js`
  - `ClaudeBROSDK/src/js/app.js`

### 2. Debug Tools Created ✅
- `ClaudeBROSDK/src/debug.html` - Shows environment and loading info
- `ClaudeBROSDK/src/redirect.html` - Helps diagnose loading issues
- Access at: https://cbo-mcp-system-hs2sx.ondigitalocean.app/sdk/debug.html

### 3. Menu Button Configuration Attempted ⚠️
- API calls to set menu button succeed but don't persist
- Both bots show "commands" type instead of "web_app"
- This appears to be a Telegram API limitation or bot configuration issue

## Immediate Solutions

### Option 1: Direct Link Access
Instead of using the menu button, access the SDK app directly:
```
https://cbo-mcp-system-hs2sx.ondigitalocean.app/sdk/
```

### Option 2: Inline Button
Send this command to the bot to get a clickable inline button:
```javascript
// Add to bot handler
bot.command('webapp', (ctx) => {
  ctx.reply('Open SDK App:', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Open SDK App', web_app: { url: 'https://cbo-mcp-system-hs2sx.ondigitalocean.app/sdk/' }}
      ]]
    }
  });
});
```

### Option 3: Clear Telegram Cache
On user's device:
1. **iOS**: Settings → Storage → Telegram → Clear Cache
2. **Android**: Settings → Apps → Telegram → Storage → Clear Cache
3. **Desktop**: Settings → Advanced → Clear Cache

### Option 4: Reconfigure Bot via @BotFather
1. Talk to @BotFather
2. Select @cbosdkbot
3. Edit Bot → Edit Botpic/About/Description
4. Menu Button → Configure Menu Button
5. Set URL: https://cbo-mcp-system-hs2sx.ondigitalocean.app/sdk/

## Technical Details

### What's Working:
- ✅ SDK app HTML loads correctly
- ✅ JavaScript files are served properly  
- ✅ API endpoints are accessible
- ✅ Production detection works
- ✅ Webhooks are configured correctly

### What's Not Working:
- ❌ Menu button won't stay as web_app type
- ❌ Cached ngrok URL in Telegram app
- ❌ Menu button API calls don't persist

## Long-term Solution

### Create New Bot (if needed):
If the cache issue persists, create a new SDK bot:
1. Talk to @BotFather
2. Create new bot
3. Set up web app from the start
4. Update tokens in deployment

### Alternative Architecture:
Consider using inline keyboards instead of menu buttons for more reliable web app access.

## Testing Commands

```bash
# Check menu button status
curl -X POST "https://api.telegram.org/bot8040936127:AAEfiJL_RkauBa_fLa1JmY9L-xPsDVYTuQM/getChatMenuButton" | jq

# Test SDK app directly
curl https://cbo-mcp-system-hs2sx.ondigitalocean.app/sdk/ | grep "<title>"

# Check debug page
curl https://cbo-mcp-system-hs2sx.ondigitalocean.app/sdk/debug.html
```

## Status
- Code fixes: ✅ Complete
- Deployment: ✅ Complete
- Menu button: ⚠️ Requires @BotFather intervention
- Cache issue: ⚠️ Requires user action or new bot