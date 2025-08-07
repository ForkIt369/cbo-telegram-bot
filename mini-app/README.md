# CBO Mini App

A modern, polished Telegram Mini App for the CBO-Bro business optimization bot.

## 🎨 Design System

### Brand Identity
- **Character**: CBO-Bro - Green cube with glasses (`public/cbo-character.png`)
- **Primary Color**: #30D158 (Fresh Green)
- **Secondary Color**: #00C851 (Deep Green)
- **Glow Effect**: rgba(48, 209, 88, 0.3)
- **Background**: #0D1117 (Deep Dark)

### Visual Style
- **Theme**: Dark mode with glassmorphism
- **Typography**: Inter, SF Pro Display
- **Effects**: Subtle animations, gradient overlays
- **Mobile-first**: Optimized for Telegram WebView

## 🏗️ Component Architecture

### Core Components

#### ChatInterface (`src/components/ChatInterface.jsx`)
Main container component managing the entire chat experience.

**Features:**
- Welcome screen with CBO character
- Quick action buttons for common queries
- Message input with send button
- Flow indicators showing active analysis
- Back navigation to return to welcome
- "Coming Soon" bar for future features

**State Management:**
- `showWelcome` - Toggle welcome/chat view
- `inputMessage` - Current input text
- `authorized` - User authorization status
- `messages` - Conversation history

#### MessageList (`src/components/MessageList.jsx`)
Displays conversation messages with proper formatting.

**Features:**
- User/Assistant message differentiation
- CBO character avatar for assistant
- User avatar with gradient background
- Flow tags on relevant messages
- Smooth animation on message appearance

#### FlowIndicator (`src/components/FlowIndicator.jsx`)
Visual indicator showing which business flow is being analyzed.

**Flow Types:**
- 💎 Value Flow - Customer delivery
- 📊 Info Flow - Data & decisions
- ⚡ Work Flow - Operations
- 💰 Cash Flow - Financial health

#### TypingIndicator (`src/components/TypingIndicator.jsx`)
Animated dots showing bot is processing response.

### Styling Architecture

#### CSS Variables (`src/styles/index.css`)
```css
:root {
  /* CBO Brand Colors */
  --cbo-primary: #30D158;
  --cbo-secondary: #00C851;
  --cbo-glow: rgba(48, 209, 88, 0.3);
  
  /* Dark Theme */
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #21262D;
  
  /* Text Colors */
  --text-primary: #E6EDF3;
  --text-secondary: #8B949E;
  --text-tertiary: #6E7681;
}
```

### Hooks

#### useChat (`src/hooks/useChat.js`)
Custom hook managing chat logic and API communication.

**Functionality:**
- Send messages to backend API
- Maintain conversation context
- Handle loading states
- Track active flow analysis
- Clear conversation

## 🚀 Development

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment
Development server runs on `http://localhost:3002`

### Build Output
Production build outputs to `dist/` directory with:
- Minified JavaScript bundles
- Optimized CSS
- Static assets (including CBO character PNG)
- HTML entry point

## 📱 Mobile Optimization

### Responsive Design
- Base font size: 16px (mobile default)
- Touch targets: Minimum 44px
- Spacing: Generous padding for fingers
- Scrolling: Smooth, momentum-based

### Performance
- Lazy loading for images
- Code splitting for routes
- Optimized bundle size (~350KB gzipped)
- Fast initial load time

## 🔄 State Management

### Local State
- React hooks for component state
- Context API for global app state (planned)
- Session storage for temporary data

### API Integration
- RESTful endpoints to backend
- WebSocket for real-time updates (planned)
- Error handling with user feedback

## 🎯 Future Enhancements

### Planned Features
- **Voice Input** - Speech-to-text for queries
- **File Upload** - Analyze business documents
- **Analytics Dashboard** - Visual insights
- **Multi-language** - International support
- **Collaboration** - Team features

### Technical Improvements
- Progressive Web App (PWA) capabilities
- Offline mode with service workers
- Real-time sync via WebSockets
- Advanced caching strategies

## 🧪 Testing

### Manual Testing
- Test in Telegram Desktop (DevTools available)
- Test on various mobile devices
- Verify in different Telegram themes

### Automated Testing (Planned)
- Jest for unit tests
- React Testing Library for components
- Cypress for E2E tests

## 📦 Deployment

The mini-app is served by the main Express server:
1. Build with `npm run build`
2. Output goes to `dist/`
3. Express serves from `/mini-app/dist`
4. Auto-deploys with main bot to DigitalOcean

## 🔒 Security

- Whitelist-based access control
- User ID verification
- HTTPS-only in production
- No sensitive data in frontend

## 📄 File Structure

```
mini-app/
├── public/
│   └── cbo-character.png    # CBO avatar image
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global CSS
│   ├── utils/              # Utility functions
│   └── App.jsx             # Main app component
├── dist/                   # Production build
└── vite.config.js         # Vite configuration
```

---

**Version**: 2.0.0  
**Last Updated**: August 2025  
**Live URL**: https://cbo-mcp-system-hs2sx.ondigitalocean.app