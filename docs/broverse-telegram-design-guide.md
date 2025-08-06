# BroVerse Telegram Mini App Design Guide
## Vanilla JS/HTML/CSS Implementation

---

## 🎨 Design Philosophy for Telegram Mini Apps

### Core Principles
1. **Zen Minimalism** - Reduce cognitive load in limited mobile space
2. **Native Feel** - Respect Telegram's interface patterns
3. **Performance First** - Optimize for mobile networks
4. **Touch Optimized** - Design for thumb-friendly interactions
5. **Progressive Disclosure** - Reveal complexity through interaction

---

## 🎨 Color System

### CSS Variables Setup
```css
:root {
  /* Avatar Brand Colors */
  --bigsis-primary: #00D4FF;
  --bigsis-secondary: #0051D5;
  --bigsis-glow: rgba(0, 212, 255, 0.3);
  
  --bro-primary: #FF9500;
  --bro-secondary: #FF6B00;
  --bro-glow: rgba(255, 149, 0, 0.3);
  
  --lilsis-primary: #9D4EDD;
  --lilsis-secondary: #7B2CBF;
  --lilsis-glow: rgba(157, 78, 221, 0.3);
  
  --cbo-primary: #30D158;
  --cbo-secondary: #00C851;
  --cbo-glow: rgba(48, 209, 88, 0.3);

  /* Dark Theme Foundation */
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #21262D;
  
  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.02);
  --glass-bg-hover: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.05);
  --glass-border-hover: rgba(255, 255, 255, 0.08);
  --glass-blur: 40px;

  /* Text Hierarchy */
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --text-tertiary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.4);

  /* Interactive States */
  --hover-bg: rgba(255, 255, 255, 0.05);
  --active-bg: rgba(255, 255, 255, 0.08);
  --focus-ring: rgba(0, 212, 255, 0.5);

  /* Telegram Specific */
  --telegram-bg: var(--tg-theme-bg-color, #0D1117);
  --telegram-text: var(--tg-theme-text-color, #FFFFFF);
  --telegram-hint: var(--tg-theme-hint-color, rgba(255, 255, 255, 0.6));
  --telegram-link: var(--tg-theme-link-color, #00D4FF);
  --telegram-button: var(--tg-theme-button-color, #00D4FF);
  --telegram-button-text: var(--tg-theme-button-text-color, #FFFFFF);
}
```

---

## 📐 Typography

### Font Setup
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Consolas', monospace;
  
  /* Mobile-Optimized Type Scale */
  --text-h1: 32px;
  --text-h2: 24px;
  --text-h3: 20px;
  --text-h4: 18px;
  --text-body: 16px;
  --text-body-small: 14px;
  --text-caption: 12px;
  --text-micro: 11px;
  
  /* Line Heights */
  --line-height-heading: 1.2;
  --line-height-body: 1.5;
  --line-height-tight: 1.3;
  
  /* Font Weights */
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Typography Classes
```css
.text-h1 {
  font-size: var(--text-h1);
  font-weight: var(--font-semibold);
  line-height: var(--line-height-heading);
  letter-spacing: -0.02em;
}

.text-h2 {
  font-size: var(--text-h2);
  font-weight: var(--font-semibold);
  line-height: var(--line-height-heading);
  letter-spacing: -0.01em;
}

.text-body {
  font-size: var(--text-body);
  font-weight: var(--font-regular);
  line-height: var(--line-height-body);
}

.text-caption {
  font-size: var(--text-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-height-body);
  color: var(--text-tertiary);
}

.text-label {
  font-size: var(--text-caption);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text-muted);
}
```

---

## 🎯 Spacing System

### Mobile-First Spacing
```css
:root {
  /* Base 8px Grid */
  --space-0: 0px;
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  
  /* Component Spacing */
  --padding-card: 16px;
  --padding-section: 20px;
  --padding-button-v: 12px;
  --padding-button-h: 20px;
  --gap-items: 12px;
  --gap-sections: 24px;
  
  /* Mobile Safe Areas */
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
  --safe-area-left: env(safe-area-inset-left);
  --safe-area-right: env(safe-area-inset-right);
}
```

---

## 🧩 Core Components

### 1. Base HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <link rel="stylesheet" href="broverse-telegram.css">
</head>
<body class="telegram-app">
    <div class="app-container">
        <!-- Your content -->
    </div>
    <script src="broverse-telegram.js"></script>
</body>
</html>
```

### 2. Glass Card Component
```html
<div class="glass-card" data-avatar="bro">
    <div class="card-header">
        <img src="avatars/bro.png" alt="Bro" class="card-avatar">
        <h3 class="card-title">Business Analysis</h3>
    </div>
    <div class="card-content">
        <p class="text-body">Content here...</p>
    </div>
    <div class="card-actions">
        <button class="btn btn-primary">Analyze</button>
    </div>
</div>
```

```css
.glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: var(--padding-card);
    margin-bottom: var(--gap-items);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.glass-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
        var(--glow-color, var(--bigsis-primary)), 
        transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.glass-card[data-avatar="bro"] {
    --glow-color: var(--bro-primary);
}

.glass-card[data-avatar="bigsis"] {
    --glow-color: var(--bigsis-primary);
}

.glass-card[data-avatar="lilsis"] {
    --glow-color: var(--lilsis-primary);
}

.glass-card[data-avatar="cbo"] {
    --glow-color: var(--cbo-primary);
}

.glass-card:active {
    transform: scale(0.98);
    background: var(--glass-bg-hover);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.card-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.card-title {
    font-size: var(--text-h3);
    font-weight: var(--font-semibold);
    margin: 0;
}

.card-content {
    margin-bottom: 16px;
}

.card-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}
```

### 3. Button Components
```html
<!-- Primary Button -->
<button class="btn btn-primary" data-avatar="bro">
    <span class="btn-text">Analyze Flow</span>
</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">
    <span class="btn-text">View Details</span>
</button>

<!-- Icon Button -->
<button class="btn btn-icon" aria-label="Settings">
    <svg class="btn-icon-svg"><!-- Icon SVG --></svg>
</button>
```

```css
.btn {
    font-family: var(--font-primary);
    font-size: var(--text-body-small);
    font-weight: var(--font-medium);
    padding: var(--padding-button-v) var(--padding-button-h);
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
}

.btn-primary {
    background: var(--telegram-button);
    color: var(--telegram-button-text);
}

.btn-primary[data-avatar="bro"] {
    background: linear-gradient(135deg, var(--bro-primary), var(--bro-secondary));
}

.btn-primary[data-avatar="bigsis"] {
    background: linear-gradient(135deg, var(--bigsis-primary), var(--bigsis-secondary));
}

.btn-primary[data-avatar="lilsis"] {
    background: linear-gradient(135deg, var(--lilsis-primary), var(--lilsis-secondary));
}

.btn-primary[data-avatar="cbo"] {
    background: linear-gradient(135deg, var(--cbo-primary), var(--cbo-secondary));
}

.btn-secondary {
    background: var(--glass-bg);
    color: var(--text-primary);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(10px);
}

.btn-icon {
    width: 44px;
    height: 44px;
    padding: 0;
    border-radius: 50%;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
}

.btn:active {
    transform: scale(0.95);
}

.btn-primary:active {
    opacity: 0.9;
}

.btn-secondary:active {
    background: var(--glass-bg-hover);
}

/* Ripple Effect */
.btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.btn:active::after {
    width: 300px;
    height: 300px;
}
```

### 4. Avatar Selector Component
```html
<div class="avatar-selector">
    <div class="avatar-option" data-avatar="bigsis" tabindex="0">
        <img src="avatars/bigsis.png" alt="Big Sis" class="avatar-img">
        <span class="avatar-name">Big Sis</span>
        <span class="avatar-role">Wisdom</span>
    </div>
    <div class="avatar-option" data-avatar="bro" tabindex="0">
        <img src="avatars/bro.png" alt="Bro" class="avatar-img">
        <span class="avatar-name">Bro</span>
        <span class="avatar-role">Energy</span>
    </div>
    <div class="avatar-option" data-avatar="lilsis" tabindex="0">
        <img src="avatars/lilsis.png" alt="Lil Sis" class="avatar-img">
        <span class="avatar-name">Lil Sis</span>
        <span class="avatar-role">Creative</span>
    </div>
    <div class="avatar-option" data-avatar="cbo" tabindex="0">
        <img src="avatars/cbo.png" alt="CBO" class="avatar-img">
        <span class="avatar-name">CBO</span>
        <span class="avatar-role">Leader</span>
    </div>
</div>
```

```css
.avatar-selector {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
}

.avatar-option {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.avatar-option::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, 
        var(--glow-color) 0%, 
        transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.avatar-option[data-avatar="bigsis"] {
    --glow-color: var(--bigsis-glow);
}

.avatar-option[data-avatar="bro"] {
    --glow-color: var(--bro-glow);
}

.avatar-option[data-avatar="lilsis"] {
    --glow-color: var(--lilsis-glow);
}

.avatar-option[data-avatar="cbo"] {
    --glow-color: var(--cbo-glow);
}

.avatar-option:active {
    transform: scale(0.95);
}

.avatar-option.selected {
    border-color: var(--glow-color);
    background: var(--glass-bg-hover);
}

.avatar-option.selected::before {
    opacity: 0.3;
}

.avatar-img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
}

.avatar-name {
    display: block;
    font-size: var(--text-body);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: 4px;
    position: relative;
    z-index: 1;
}

.avatar-role {
    display: block;
    font-size: var(--text-caption);
    color: var(--text-tertiary);
    position: relative;
    z-index: 1;
}
```

### 5. Flow Visualization Component
```html
<div class="flow-container">
    <canvas id="flowCanvas" class="flow-canvas"></canvas>
    <div class="flow-legend">
        <div class="flow-item" data-flow="value">
            <span class="flow-dot"></span>
            <span class="flow-label">Value Flow</span>
        </div>
        <div class="flow-item" data-flow="info">
            <span class="flow-dot"></span>
            <span class="flow-label">Info Flow</span>
        </div>
        <div class="flow-item" data-flow="work">
            <span class="flow-dot"></span>
            <span class="flow-label">Work Flow</span>
        </div>
        <div class="flow-item" data-flow="cash">
            <span class="flow-dot"></span>
            <span class="flow-label">Cash Flow</span>
        </div>
    </div>
</div>
```

---

## 📱 JavaScript Interactions

### 1. Telegram WebApp Integration
```javascript
// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// Configure app
tg.ready();
tg.expand();
tg.setHeaderColor('#0D1117');
tg.setBackgroundColor('#0D1117');

// Theme Detection
const theme = tg.colorScheme; // 'light' or 'dark'
document.body.classList.add(`theme-${theme}`);

// Main Button Setup
tg.MainButton.text = "Continue";
tg.MainButton.color = "#00D4FF";
tg.MainButton.textColor = "#FFFFFF";
tg.MainButton.onClick(() => {
    // Handle main button click
    handleContinue();
});
tg.MainButton.show();

// Back Button
tg.BackButton.onClick(() => {
    // Handle back navigation
    navigateBack();
});

// Haptic Feedback
function hapticFeedback(type = 'light') {
    if (tg.HapticFeedback) {
        switch(type) {
            case 'light':
                tg.HapticFeedback.impactOccurred('light');
                break;
            case 'medium':
                tg.HapticFeedback.impactOccurred('medium');
                break;
            case 'heavy':
                tg.HapticFeedback.impactOccurred('heavy');
                break;
            case 'success':
                tg.HapticFeedback.notificationOccurred('success');
                break;
            case 'warning':
                tg.HapticFeedback.notificationOccurred('warning');
                break;
            case 'error':
                tg.HapticFeedback.notificationOccurred('error');
                break;
        }
    }
}
```

### 2. Avatar Selection Handler
```javascript
class AvatarSelector {
    constructor(container) {
        this.container = container;
        this.options = container.querySelectorAll('.avatar-option');
        this.selected = null;
        this.init();
    }

    init() {
        this.options.forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectAvatar(option);
            });

            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectAvatar(option);
                }
            });
        });
    }

    selectAvatar(option) {
        // Remove previous selection
        this.options.forEach(opt => opt.classList.remove('selected'));
        
        // Add selection
        option.classList.add('selected');
        this.selected = option.dataset.avatar;
        
        // Haptic feedback
        hapticFeedback('light');
        
        // Emit event
        this.container.dispatchEvent(new CustomEvent('avatarSelected', {
            detail: { avatar: this.selected }
        }));
        
        // Update theme
        this.updateTheme(this.selected);
    }

    updateTheme(avatar) {
        document.body.setAttribute('data-theme-avatar', avatar);
        
        // Update CSS variables
        const root = document.documentElement;
        switch(avatar) {
            case 'bigsis':
                root.style.setProperty('--theme-primary', 'var(--bigsis-primary)');
                root.style.setProperty('--theme-secondary', 'var(--bigsis-secondary)');
                root.style.setProperty('--theme-glow', 'var(--bigsis-glow)');
                break;
            case 'bro':
                root.style.setProperty('--theme-primary', 'var(--bro-primary)');
                root.style.setProperty('--theme-secondary', 'var(--bro-secondary)');
                root.style.setProperty('--theme-glow', 'var(--bro-glow)');
                break;
            case 'lilsis':
                root.style.setProperty('--theme-primary', 'var(--lilsis-primary)');
                root.style.setProperty('--theme-secondary', 'var(--lilsis-secondary)');
                root.style.setProperty('--theme-glow', 'var(--lilsis-glow)');
                break;
            case 'cbo':
                root.style.setProperty('--theme-primary', 'var(--cbo-primary)');
                root.style.setProperty('--theme-secondary', 'var(--cbo-secondary)');
                root.style.setProperty('--theme-glow', 'var(--cbo-glow)');
                break;
        }
    }
}

// Initialize
const avatarSelector = new AvatarSelector(
    document.querySelector('.avatar-selector')
);
```

### 3. Flow Visualization
```javascript
class FlowVisualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.flows = {
            value: { color: '#00D4FF', angle: 0, radius: 80 },
            info: { color: '#FF9500', angle: Math.PI / 2, radius: 80 },
            work: { color: '#9D4EDD', angle: Math.PI, radius: 80 },
            cash: { color: '#30D158', angle: Math.PI * 1.5, radius: 80 }
        };
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 200;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    drawFlow(flow, progress) {
        const { color, angle, radius } = flow;
        
        this.ctx.beginPath();
        this.ctx.arc(
            this.centerX,
            this.centerY,
            radius,
            angle - 0.5,
            angle + progress * Math.PI / 2
        );
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
        
        // Glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = color;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    animate() {
        let progress = 0;
        const animation = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            progress += 0.02;
            if (progress > 1) progress = 0;
            
            Object.values(this.flows).forEach(flow => {
                this.drawFlow(flow, progress);
            });
            
            requestAnimationFrame(animation);
        };
        animation();
    }
}

// Initialize
const flowViz = new FlowVisualization('flowCanvas');
```

### 4. Touch Gesture Handler
```javascript
class TouchGestures {
    constructor(element) {
        this.element = element;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.init();
    }

    init() {
        this.element.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: true });

        this.element.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: true });

        this.element.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        }, { passive: true });
    }

    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.currentX = this.startX;
        this.currentY = this.startY;
    }

    handleTouchMove(e) {
        this.currentX = e.touches[0].clientX;
        this.currentY = e.touches[0].clientY;
        
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        
        // Swipe detection
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.element.dispatchEvent(new Event('swipeRight'));
            } else {
                this.element.dispatchEvent(new Event('swipeLeft'));
            }
        }
    }

    handleTouchEnd(e) {
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        
        // Tap detection
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            this.element.dispatchEvent(new Event('tap'));
            hapticFeedback('light');
        }
    }
}
```

---

## 📱 Telegram Mini App Specific Considerations

### 1. Performance Optimization
```css
/* Reduce blur for better performance */
@media (max-width: 768px) {
    :root {
        --glass-blur: 10px; /* Reduced from 40px */
    }
    
    .glass-card {
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }
}

/* Disable animations for low-end devices */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### 2. Network Optimization
```javascript
// Lazy load images
class LazyLoader {
    constructor() {
        this.images = document.querySelectorAll('img[data-src]');
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            this.images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            this.images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
}

// Initialize
new LazyLoader();
```

### 3. Offline Support
```javascript
// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
}

// Cache Strategy (sw.js)
const CACHE_NAME = 'broverse-v1';
const urlsToCache = [
    '/',
    '/broverse-telegram.css',
    '/broverse-telegram.js',
    '/avatars/bigsis.png',
    '/avatars/bro.png',
    '/avatars/lilsis.png',
    '/avatars/cbo.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});
```

### 4. Data Persistence
```javascript
// Local Storage Helper
class DataStore {
    constructor() {
        this.prefix = 'broverse_';
    }

    set(key, value) {
        try {
            localStorage.setItem(
                this.prefix + key, 
                JSON.stringify(value)
            );
            return true;
        } catch (e) {
            console.error('Storage failed:', e);
            return false;
        }
    }

    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Retrieval failed:', e);
            return null;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clear() {
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .forEach(key => localStorage.removeItem(key));
    }
}

const dataStore = new DataStore();

// Save user preferences
dataStore.set('selectedAvatar', 'bro');
dataStore.set('userSettings', {
    theme: 'dark',
    hapticEnabled: true,
    soundEnabled: false
});
```

---

## 🎯 Best Practices

### 1. Accessibility
- Minimum touch target size: 44x44px
- Color contrast ratio: 4.5:1 minimum
- Focus indicators for keyboard navigation
- ARIA labels for interactive elements
- Screen reader support

### 2. Performance
- Minimize DOM manipulations
- Use CSS transforms over position changes
- Debounce scroll and resize events
- Lazy load non-critical resources
- Optimize images (WebP format preferred)

### 3. Security
- Validate all user inputs
- Use Content Security Policy
- Sanitize data from Telegram
- Implement rate limiting
- Never store sensitive data locally

### 4. Testing
```javascript
// Device Testing Checklist
const testDevices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'Samsung Galaxy S21', width: 412, height: 915 },
    { name: 'iPad Mini', width: 768, height: 1024 }
];

// Network conditions
const networkConditions = [
    { name: '4G', download: 12000, upload: 3000, latency: 20 },
    { name: '3G', download: 1600, upload: 768, latency: 300 },
    { name: 'Slow 3G', download: 400, upload: 400, latency: 2000 }
];
```

---

## 📚 Resources & References

### CSS Files Structure
```
/styles/
  ├── broverse-base.css      # Core design tokens
  ├── broverse-components.css # Component styles
  ├── broverse-telegram.css   # Telegram-specific overrides
  └── broverse-animations.css # Animation library
```

### JavaScript Modules
```
/js/
  ├── broverse-core.js        # Core functionality
  ├── broverse-telegram.js    # Telegram WebApp integration
  ├── broverse-avatars.js     # Avatar system
  ├── broverse-flows.js       # Flow visualizations
  └── broverse-utils.js       # Utility functions
```

### Assets Organization
```
/assets/
  ├── avatars/
  │   ├── bigsis.png
  │   ├── bro.png
  │   ├── lilsis.png
  │   └── cbo.png
  ├── icons/
  │   └── [icon files]
  └── fonts/
      └── inter/
```

---

## 🚀 Quick Start Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>BroVerse Mini App</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        /* Inline critical CSS */
        :root {
            --bigsis-primary: #00D4FF;
            --bro-primary: #FF9500;
            --lilsis-primary: #9D4EDD;
            --cbo-primary: #30D158;
            --bg-primary: #0D1117;
            --text-primary: #FFFFFF;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
        }
    </style>
    <link rel="stylesheet" href="broverse-telegram.css">
</head>
<body class="telegram-app">
    <div class="app-container">
        <!-- Your content here -->
    </div>
    
    <script>
        // Initialize Telegram WebApp
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Your app logic
    </script>
    <script src="broverse-telegram.js" defer></script>
</body>
</html>
```

---

*This design guide is optimized for Telegram Mini Apps and follows the BroVerse Design System principles while respecting platform constraints and best practices.*