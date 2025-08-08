# Frontend Components Documentation

## HTML Structure Overview

```
index.html
    │
    ├── <head>
    │   ├── Meta tags (viewport, charset)
    │   ├── Google Fonts (Inter)
    │   ├── CSS imports (main.css, chat.css)
    │   └── Telegram Web App SDK
    │
    └── <body>
        └── .app-container
            ├── .app-header
            │   ├── .brand (logo + status)
            │   ├── .mode-switcher
            │   └── .header-actions
            │
            ├── .welcome-screen
            │   └── .welcome-content
            │       ├── Avatar + Badge
            │       ├── Title + Subtitle
            │       ├── Feature Cards
            │       └── Start Button
            │
            └── .chat-container
                ├── .chat-messages
                │   └── [Dynamic Messages]
                └── .input-bar
                    └── .input-container
```

## Component Breakdown

### 1. App Header Component

```javascript
┌────────────────────────────────────────────────────────┐
│                      App Header                        │
├─────────────────┬──────────────────┬──────────────────┤
│     Brand       │   Mode Switcher  │  Header Actions  │
│  ┌──────────┐   │  ┌──┐ ┌──┐ ┌──┐ │   ┌──┐  ┌──┐    │
│  │   Logo   │   │  │📊│ │🎨│ │🔍│ │   │✕ │  │⚙ │    │
│  │  Status  │   │  └──┘ └──┘ └──┘ │   └──┘  └──┘    │
│  └──────────┘   │                  │                  │
└─────────────────┴──────────────────┴──────────────────┘
```

**HTML Structure:**
```html
<header class="app-header">
  <div class="header-content">
    <div class="brand">
      <img src="assets/avatars/cbo.png" alt="CBO" class="brand-avatar">
      <div class="brand-info">
        <h1 class="brand-name">ClaudeBRO SDK</h1>
        <div class="connection-status">Connecting...</div>
      </div>
    </div>
    
    <div class="mode-switcher">
      <button class="mode-btn" data-mode="analyze">...</button>
      <button class="mode-btn" data-mode="create">...</button>
      <button class="mode-btn" data-mode="research">...</button>
      <button class="mode-btn" data-mode="optimize">...</button>
    </div>
    
    <div class="header-actions">
      <button class="action-btn" id="clearBtn">...</button>
      <button class="action-btn" id="settingsBtn">...</button>
    </div>
  </div>
</header>
```

**JavaScript Interaction:**
```javascript
// Mode switching
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const mode = e.target.dataset.mode;
    claudeBROApp.changeMode(mode);
  });
});

// Connection status updates
updateConnectionStatus(connected) {
  const statusEl = document.querySelector('.connection-status');
  statusEl.classList.toggle('connected', connected);
  statusEl.textContent = connected ? 'Connected' : 'Disconnected';
}
```

### 2. Welcome Screen Component

```
┌───────────────────────────────────────────────┐
│              Welcome Screen                   │
│                                                │
│            ┌─────────────┐                    │
│            │  CBO Avatar │                    │
│            │    Badge    │                    │
│            └─────────────┘                    │
│                                                │
│         Chief Bro Officer                     │
│    Your AI Business Optimization Expert       │
│                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Value │ │Info  │ │Work  │ │Cash  │        │
│  │Flow  │ │Flow  │ │Flow  │ │Flow  │        │
│  └──────┘ └──────┘ └──────┘ └──────┘        │
│                                                │
│        [ Start Optimization Journey ]         │
└───────────────────────────────────────────────┘
```

**Features:**
- Avatar with "Powered by Claude 3.5 Sonnet" badge
- Four feature cards representing BBMM flows
- Start button to initiate chat
- Auto-start when in Telegram context

### 3. Chat Container Component

```
┌───────────────────────────────────────────────┐
│              Chat Messages Area               │
│                                                │
│  ┌──┬────────────────────────────────────┐   │
│  │👤│ User message here...                │   │
│  └──┴────────────────────────────────────┘   │
│                                                │
│  ┌──┬────────────────────────────────────┐   │
│  │🤖│ CBO response here...                │   │
│  │  │ • Analyzing through BBMM framework  │   │
│  │  │ • Identifying opportunities         │   │
│  └──┴────────────────────────────────────┘   │
│                                                │
│  ┌──┬────────────────────────────────────┐   │
│  │🔧│ Tool: Notion Search                 │   │
│  └──┴────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│                 Input Bar                     │
│  ┌──┬──────────────────────────────────┬──┐  │
│  │📎│  Ask about your business...       │➤ │  │
│  └──┴──────────────────────────────────┴──┘  │
└───────────────────────────────────────────────┘
```

**Message Structure:**
```html
<div class="message message-user">
  <div class="message-avatar">
    <img src="assets/avatars/user.png" alt="You">
  </div>
  <div class="message-bubble">
    <div class="message-header">
      <span class="message-name">You</span>
      <span class="message-time">10:30 AM</span>
    </div>
    <div class="message-content">Message content here...</div>
  </div>
</div>
```

## Dynamic Components

### 1. Typing Indicator

```html
<div class="typing-indicator">
  <span></span>
  <span></span>
  <span></span>
</div>
```

```css
@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}
```

### 2. Tool Status Indicator

```javascript
handleToolStatus(data) {
  const indicator = document.createElement('div');
  indicator.className = 'tool-indicator';
  indicator.innerHTML = `
    <span class="tool-icon">🔧</span>
    <span class="tool-name">${data.tool}</span>
    <span class="tool-status">${data.status}</span>
  `;
  messagesContainer.appendChild(indicator);
  setTimeout(() => indicator.remove(), 3000);
}
```

### 3. Notification System

```javascript
showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
```

## Component States

### Connection States
```
disconnected → connecting → connected → reconnecting
     ↑                                        ↓
     └────────────── error ←─────────────────┘
```

### Message States
```
pending → streaming → complete
           ↓
         error
```

### Mode States
```
analyze ←→ create ←→ research ←→ optimize
```

## Event Flow

```
User Action
     ↓
DOM Event
     ↓
ClaudeBROApp Handler
     ↓
ClaudeSDKBridge Method
     ↓
WebSocket Message
     ↓
Server Processing
     ↓
WebSocket Response
     ↓
Bridge Event Emission
     ↓
App Event Handler
     ↓
UI Update
```

## Responsive Design

### Breakpoints
```css
/* Mobile First */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### Telegram Web App Integration
```javascript
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0D1117');
  tg.setBackgroundColor('#0D1117');
}
```

## Performance Optimizations

1. **Virtual Scrolling**: Messages container with overflow
2. **Lazy Loading**: Components loaded on demand
3. **Event Delegation**: Single listeners for multiple elements
4. **RequestAnimationFrame**: Smooth animations
5. **Debouncing**: Input and scroll events

## Accessibility Features

- ARIA labels on buttons
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast mode support

## Next Steps
- [JavaScript Modules →](./javascript-modules.md)
- [CSS Styling System →](./css-styling.md)
- [WebSocket Bridge →](./websocket.md)