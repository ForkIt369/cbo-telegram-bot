# CBO Telegram Mini App Setup

## 🎨 Overview

The CBO Mini App provides a beautiful chat interface for your Telegram bot with:
- Modern React-based UI using Telegram UI components
- Smooth animations with Framer Motion
- Real-time flow indicators (Value, Info, Work, Cash)
- Typing indicators and haptic feedback
- Responsive design for all devices

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install bot dependencies
npm install

# Install Mini App dependencies
cd mini-app
npm install
```

### 2. Configure Environment

```bash
# Copy environment files
cp .env.example .env
cd mini-app
cp .env.example .env
```

### 3. Run Development

```bash
# Terminal 1: Run the bot
npm run dev

# Terminal 2: Run the Mini App
cd mini-app
npm run dev
```

### 4. Create Mini App in BotFather

1. Open @BotFather in Telegram
2. Send `/mybots` and select your bot
3. Select "Bot Settings" → "Menu Button" → "Configure menu button"
4. Send the URL: `https://your-domain.com` (or use ngrok for testing)

## 📱 Features

### Chat Interface
- **Avatar & Header**: Shows CBO-Bro with status
- **Flow Indicators**: Visual indicators for active business flow
- **Message Bubbles**: Styled messages with proper alignment
- **Quick Actions**: Pre-defined questions for easy start
- **Typing Indicator**: Animated dots while bot is thinking

### Technical Features
- **Telegram SDK Integration**: Full Mini App capabilities
- **Theme Support**: Adapts to user's Telegram theme
- **Haptic Feedback**: Native feel on supported devices
- **Responsive Design**: Works on all screen sizes

## 🏗️ Architecture

```
mini-app/
├── src/
│   ├── components/       # React components
│   │   ├── ChatInterface.jsx    # Main chat UI
│   │   ├── MessageList.jsx      # Message display
│   │   ├── TypingIndicator.jsx  # Loading animation
│   │   └── FlowIndicator.jsx    # Business flow badges
│   ├── hooks/           # Custom React hooks
│   │   └── useChat.js   # Chat logic & API calls
│   └── styles/          # CSS files
├── public/              # Static assets
└── vite.config.js       # Build configuration
```

## 🌐 Production Deployment

### Option 1: Deploy with Main Bot

1. Build the Mini App:
```bash
cd mini-app
npm run build
```

2. The built files will be served by Express at `/`

3. Update your DigitalOcean deployment:
```bash
git add .
git commit -m "Add Telegram Mini App"
git push origin master
```

### Option 2: Separate Deployment

Deploy Mini App to Vercel/Netlify:
```bash
cd mini-app
npm run build
# Deploy dist/ folder
```

Update `VITE_API_URL` to point to your bot's API.

## 🔧 Customization

### Theme Colors
The Mini App automatically uses Telegram's theme colors. To customize:

```css
/* In your CSS files */
.custom-element {
  background: var(--tgui--bg_color);
  color: var(--tgui--text_color);
}
```

### Flow Colors
Edit `FlowIndicator.jsx`:
```javascript
const flows = {
  value: { emoji: '💎', color: '#667eea' },
  info: { emoji: '📊', color: '#48bb78' },
  work: { emoji: '⚙️', color: '#ed8936' },
  cash: { emoji: '💰', color: '#38b2ac' }
};
```

### Quick Actions
Edit `ChatInterface.jsx` to change preset questions:
```jsx
<Button onClick={() => setInputMessage("Your custom question")}>
  Custom Action
</Button>
```

## 🧪 Testing

### Local Testing with ngrok
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Use the HTTPS URL in BotFather
```

### Test Different Themes
1. Change Telegram theme (Settings → Appearance)
2. Mini App will adapt automatically

## 📊 Mini App Benefits

- **Better UX**: Native-feeling interface
- **Persistent UI**: Stays open while chatting
- **Rich Interactions**: Buttons, animations, gestures
- **Offline Support**: Can add PWA features
- **Analytics**: Track user interactions

## 🔗 Resources

- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [Telegram UI Kit](https://github.com/telegram-mini-apps/telegram-ui)
- [SDK Documentation](https://docs.telegram-mini-apps.com)

## 🎯 Next Steps

1. Add voice input support
2. Implement chart visualizations for flows
3. Add export functionality for insights
4. Create onboarding flow for new users
5. Add notification system for alerts