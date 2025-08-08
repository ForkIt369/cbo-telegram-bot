# CBO-Bro Mini App UI/UX Brief for Redesign

## Current Implementation Overview

### Tech Stack
- **Framework**: React + Vite
- **UI Library**: @telegram-apps/telegram-ui
- **Animation**: Framer Motion
- **State Management**: Custom hooks (useChat)
- **API**: Axios for backend communication
- **Styling**: CSS Modules with CSS variables

### Current Architecture

#### Component Structure
```
ChatInterface (Main Container)
├── Header Section
│   ├── Back Button (conditional)
│   ├── CBO Avatar & Title
│   ├── Status Badge
│   └── FlowIndicator Component
├── Messages Area
│   ├── Welcome Screen (conditional)
│   │   ├── CBO Avatar Animation
│   │   ├── Feature Grid (4 flows)
│   │   └── Quick Action Buttons
│   ├── MessageList Component
│   │   ├── Message Bubbles
│   │   ├── Progressive Typing
│   │   ├── Message Formatting
│   │   └── Timestamps
│   └── TypingIndicator Component
└── Input Section
    ├── Message Input Field
    ├── Send Button
    └── Coming Soon Bar
```

## Current User Flow

### 1. Initial Load
- Auth check via `/api/auth/check`
- Loading spinner during verification
- Access denied screen for unauthorized users
- Telegram WebApp initialization (theme, viewport, haptics)

### 2. Welcome State
- Large animated CBO avatar (green cube with glasses)
- Four flow cards with icons (Value, Info, Work, Cash)
- Quick action buttons for common queries
- Disappears on first message

### 3. Chat Interaction
- User types message → Send button activates
- Enter key sends message
- Loading state with typing indicator
- Progressive word-by-word display for AI responses
- Long messages chunked into 280-char segments
- Flow detection highlights relevant business area

### 4. Message Features
- **Formatting**: Bold, italic, code blocks, quotes, links
- **Animations**: Fade in, slide up, typing cursor
- **Timestamps**: Shown on hover
- **Flow Tags**: Visual indicators for detected business flow
- **Haptic Feedback**: Light on send, success on receive, error on fail

### 5. Navigation
- Back button returns to welcome screen
- Clear chat functionality
- Persistent chat history per user

## Current Design System

### Color Palette
```css
/* CBO Brand */
--cbo-primary: #30D158 (Fresh Green)
--cbo-secondary: #00C851 (Deep Green)
--cbo-glow: rgba(48, 209, 88, 0.3)
--cbo-hover: rgba(48, 209, 88, 0.1)

/* Dark Theme */
--bg-primary: #0D1117 (Deep Dark)
--bg-secondary: #161B22 (Elevated Surface)
--bg-tertiary: #21262D (Higher Elevation)
--bg-elevated: #30363D (Highest)

/* Text */
--text-primary: #FFFFFF
--text-secondary: #8B949E
--text-tertiary: #6E7681

/* Status */
--error: #F85149
--warning: #F0883E
--info: #58A6FF
--success: #56D364
```

### Typography
- **Primary Font**: Inter, -apple-system, SF Pro Display
- **Mono Font**: SF Mono, Monaco, Inconsolata
- **Font Sizes**: 
  - Headers: 1.5rem (24px)
  - Body: 0.9375rem (15px)
  - Small: 0.8125rem (13px)
  - Caption: 0.6875rem (11px)

### Spacing & Layout
- **Border Radius**: 6px (sm), 8px (md), 12px (lg), 16px (xl)
- **Padding**: 0.75rem standard, 1rem comfortable
- **Message Bubbles**: 80% max width, 85% on mobile
- **Touch Targets**: 44px minimum height

### Animations
- **Transitions**: 0.15s (fast), 0.3s (base), 0.5s (slow)
- **Effects**: Fade in/up, slide, pulse, shimmer
- **Progressive Typing**: 30-50ms delay between words
- **Cognitive Pause**: 400-800ms before AI response

## Current UI Components

### 1. Message Bubbles
- **User**: Right-aligned, user avatar emoji
- **Assistant**: Left-aligned, CBO character image
- **Styling**: Card background, subtle shadow
- **Features**: Formatted text, flow tags, timestamps

### 2. Welcome Screen
- **Avatar**: 80x80px animated with pulse effect
- **Feature Grid**: 2x2 grid, hover animations
- **Quick Actions**: 2x2 button grid

### 3. Input Area
- **Field**: Full width with rounded borders
- **Send Button**: Circular with gradient
- **States**: Disabled during loading
- **Placeholder**: "Ask about your business..."

### 4. Flow Indicator
- **Position**: Header right side
- **Animation**: Fade in/out
- **Colors**: Match flow type (Value, Info, Work, Cash)

### 5. Typing Indicator
- **Style**: Three animated dots
- **Text**: "AI is thinking..."
- **Position**: Below message list

## Accessibility Features
- ARIA labels on interactive elements
- Role attributes for semantic structure
- Keyboard navigation support
- Focus visible outlines
- Screen reader announcements

## Mobile Optimizations
- Responsive font sizing (14px base on mobile)
- Touch-optimized tap targets
- Viewport height management
- Telegram WebApp integration
- Haptic feedback hooks

## Performance Optimizations
- Lazy loading for images
- Message virtualization consideration
- Debounced input handling
- Optimistic UI updates
- Efficient re-renders with React hooks

## API Integration Points

### Endpoints
- `POST /api/auth/check` - User authorization
- `GET /api/chat/history/{userId}` - Load chat history
- `POST /api/chat/message` - Send message
- `POST /api/chat/clear` - Clear chat history

### Data Flow
1. User message → Frontend validation
2. Optimistic UI update
3. API call with userId and message
4. Response processing and formatting
5. UI update with AI response
6. Flow detection and highlighting

## Areas for Enhancement

### 1. Visual Design
- Current design is functional but could be more distinctive
- Limited brand personality beyond green color
- Standard chat UI without unique elements
- Basic animation set

### 2. User Experience
- No voice input (marked as coming soon)
- No file upload (marked as coming soon)
- No analytics dashboard (marked as coming soon)
- Limited onboarding guidance
- No conversation export/save

### 3. Interaction Design
- Basic text-only input
- No suggested responses
- No conversation branching
- Limited context awareness
- No multi-turn wizards

### 4. Information Architecture
- Single linear chat view
- No conversation history browser
- No topic categorization
- Limited navigation options

### 5. Personalization
- No user preferences
- No conversation templates
- No saved queries
- No customizable quick actions

## Technical Constraints
- Must work within Telegram WebApp environment
- Must support both light/dark Telegram themes
- Must handle variable viewport heights
- Must work on older mobile devices
- Must maintain <2MB bundle size

## Brand Requirements
- CBO character (green cube with glasses) must be prominent
- Four Flows framework must be integrated
- Professional yet approachable tone
- Focus on business optimization
- AI-powered expertise positioning

## Prototype Requirements

### Must Have
1. Unique visual identity that stands out
2. Smooth, delightful micro-interactions
3. Clear information hierarchy
4. Mobile-first responsive design
5. Telegram theme integration

### Nice to Have
1. Advanced input methods (voice, drawing)
2. Data visualization components
3. Conversation templates
4. Multi-step workflows
5. Analytics dashboard

### Future Considerations
1. Multi-language support
2. Offline mode capabilities
3. Push notifications
4. Deep linking support
5. External integrations

## Success Metrics
- User engagement time
- Message completion rate
- Quick action usage
- Return user rate
- User satisfaction score

## Deliverables Expected
1. High-fidelity mockups/prototypes
2. Component library documentation
3. Interaction specifications
4. Animation guidelines
5. Implementation roadmap

---

This brief provides a complete picture of the current implementation to help guide the redesign process. The goal is to evolve from a functional chat interface to a distinctive, delightful experience that embodies the CBO-Bro brand while maintaining technical feasibility within the Telegram Mini App constraints.