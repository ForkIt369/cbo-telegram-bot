// CBO Chat Application Logic

class CBOChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatContainer = document.getElementById('chatContainer');
        
        this.isTyping = false;
        this.messageHistory = [];
        this.chatStarted = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Send message
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }

        // Simple input focus effects
        if (this.messageInput && this.sendBtn) {
            this.messageInput.addEventListener('focus', () => {
                this.sendBtn.style.transform = 'scale(1.1)';
            });

            this.messageInput.addEventListener('blur', () => {
                this.sendBtn.style.transform = 'scale(1)';
            });
        }

        // Input field focus effects
        if (this.messageInput && this.sendBtn) {
            this.messageInput.addEventListener('focus', () => {
                this.sendBtn.style.transform = 'scale(1.1)';
            });

            this.messageInput.addEventListener('blur', () => {
                this.sendBtn.style.transform = 'scale(1)';
            });
        }
    }


    sendMessage() {
        if (!this.messageInput) return;
        
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.messageHistory.push({ role: 'user', content: message });
        
        // Clear input
        this.messageInput.value = '';
        
        // Haptic feedback
        this.hapticFeedback('light');

        // Show typing indicator
        this.showTyping();

        // Simulate bot response with better timing
        setTimeout(() => {
            this.hideTyping();
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
            this.messageHistory.push({ role: 'bot', content: response });
        }, 800 + Math.random() * 700);
    }

    addMessage(text, sender) {
        if (!this.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const time = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });

        const avatarContent = sender === 'user' 
            ? 'You' 
            : '<img src="assets/avatars/cbo.png" alt="CBO">';

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatarContent}</div>
            <div class="message-content">
                <div class="message-text">${text}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTyping() {
        if (this.isTyping || !this.chatMessages) return;
        this.isTyping = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar"><img src="assets/avatars/cbo.png" alt="CBO"></div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    generateResponse(message) {
        const responses = [
            "Let me analyze your business flows using the BBMM framework. I can see opportunities to optimize your value stream.",
            "Based on the Four Flows analysis, your primary bottleneck appears to be in the information flow between departments.",
            "Looking at your Work Flow efficiency, I'm seeing patterns that suggest process automation could yield significant time savings.",
            "Your Cash Flow cycle could be optimized. Let me break down the key improvement areas.",
            "Value Flow analysis reveals customer journey friction points we should address."
        ];

        // Get random response
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Add some intelligence based on keywords
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('cash') || lowerMessage.includes('money') || lowerMessage.includes('revenue')) {
            return "💰 Cash Flow Analysis: Your revenue cycle shows opportunities for 20-30% improvement in collection times.";
        } else if (lowerMessage.includes('customer') || lowerMessage.includes('value')) {
            return "💎 Value Flow: I've identified 3 key friction points in your customer journey that we can optimize.";
        } else if (lowerMessage.includes('data') || lowerMessage.includes('information')) {
            return "📊 Info Flow: Your data silos are creating decision delays. Let's implement real-time dashboards.";
        } else if (lowerMessage.includes('process') || lowerMessage.includes('work')) {
            return "⚡ Work Flow: Process automation could save 40% of manual tasks. Here's where to start...";
        }
        
        // Default response
        return randomResponse;
    }

    startConversation() {
        // Initial greeting
        setTimeout(() => {
            this.addMessage(
                "Hey! I'm your Chief Bro Officer. Ready to analyze your business through the Four Flows framework.", 
                'bot'
            );
            
            // Follow-up
            setTimeout(() => {
                this.showTyping();
                setTimeout(() => {
                    this.hideTyping();
                    this.addMessage(
                        "What's your biggest business challenge right now? I'll analyze it through Value, Info, Work, and Cash flows.",
                        'bot'
                    );
                }, 1200);
            }, 800);
        }, 300);
    }

    runDemoFlow() {
        // User asks a question
        setTimeout(() => {
            this.addMessage(
                "Our customer acquisition cost is too high and conversion rates are dropping",
                'user'
            );
        }, 3500);

        // Bot typing
        setTimeout(() => {
            this.showTyping();
        }, 4500);

        // Bot response
        setTimeout(() => {
            this.hideTyping();
            this.addMessage(
                "I see a Value Flow issue here. High CAC with dropping conversions typically indicates friction in your customer journey. Let me analyze this across all four flows...",
                'bot'
            );
        }, 6000);

        // Bot typing again
        setTimeout(() => {
            this.showTyping();
        }, 7500);

        // Detailed analysis
        setTimeout(() => {
            this.hideTyping();
            this.addMessage(
                "📊 Analysis Complete:\n\n💎 Value Flow: Your customer journey has 7 touchpoints but only 2 add real value\n\n📊 Info Flow: Data silos between marketing and sales - no unified customer view\n\n⚡ Work Flow: Manual lead qualification taking 48hrs average\n\n💰 Cash Flow: 67-day sales cycle impacting cash conversion\n\nQuick Win: Automate lead scoring to reduce qualification time by 80%",
                'bot'
            );
        }, 9000);
    }

    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    hapticFeedback(type = 'light') {
        // This would integrate with Telegram's haptic feedback API
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            const tg = window.Telegram.WebApp;
            switch(type) {
                case 'light':
                    tg.HapticFeedback.impactOccurred('light');
                    break;
                case 'medium':
                    tg.HapticFeedback.impactOccurred('medium');
                    break;
                case 'success':
                    tg.HapticFeedback.notificationOccurred('success');
                    break;
            }
        }
    }
}

// Start chat function (global for onclick handler)
function startChat() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatContainer = document.getElementById('chatContainer');
    
    if (!welcomeScreen || !chatContainer) return;
    
    // Fade out welcome screen
    welcomeScreen.classList.add('fade-out');
    
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        chatContainer.style.display = 'flex';  // Use flex for proper layout
        
        // Focus input with delay for smooth transition
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.focus();
            }
        }, 100);
        
        // Start conversation
        if (window.cboChat && !window.cboChat.chatStarted) {
            window.cboChat.chatStarted = true;
            window.cboChat.startConversation();
            
            // Run demo flow if needed
            if (window.location.hash === '#demo') {
                window.cboChat.runDemoFlow();
            }
        }
    }, 300);
}


// Initialize the chat app
document.addEventListener('DOMContentLoaded', () => {
    window.cboChat = new CBOChat();
    
    // Auto-start demo if hash is present
    if (window.location.hash === '#demo') {
        setTimeout(() => {
            startChat();
        }, 1000);
    }
});