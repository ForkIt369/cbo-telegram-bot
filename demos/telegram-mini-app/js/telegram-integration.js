// Telegram WebApp Integration

class TelegramIntegration {
    constructor() {
        this.tg = window.Telegram ? window.Telegram.WebApp : null;
        this.init();
    }

    init() {
        if (!this.tg) {
            console.log('Running in browser mode - Telegram WebApp not available');
            this.simulateTelegramEnvironment();
            return;
        }

        // Initialize Telegram WebApp
        this.tg.ready();
        this.tg.expand();

        // Set theme colors
        this.tg.setHeaderColor('#0D1117');
        this.tg.setBackgroundColor('#0D1117');

        // Configure main button
        this.setupMainButton();

        // Handle back button
        this.setupBackButton();

        // Get user data
        this.getUserData();

        // Handle theme changes
        this.handleThemeChanges();
    }

    simulateTelegramEnvironment() {
        // Simulate Telegram environment for browser testing
        window.Telegram = {
            WebApp: {
                ready: () => console.log('Telegram WebApp ready (simulated)'),
                expand: () => console.log('Expanded app (simulated)'),
                close: () => console.log('Closed app (simulated)'),
                MainButton: {
                    text: '',
                    color: '',
                    textColor: '',
                    isVisible: false,
                    isActive: true,
                    show: () => console.log('Main button shown'),
                    hide: () => console.log('Main button hidden'),
                    onClick: (callback) => console.log('Main button click handler set')
                },
                BackButton: {
                    isVisible: false,
                    show: () => console.log('Back button shown'),
                    hide: () => console.log('Back button hidden'),
                    onClick: (callback) => console.log('Back button click handler set')
                },
                HapticFeedback: {
                    impactOccurred: (style) => console.log(`Haptic feedback: ${style}`),
                    notificationOccurred: (type) => console.log(`Notification feedback: ${type}`),
                    selectionChanged: () => console.log('Selection changed feedback')
                },
                colorScheme: 'dark',
                themeParams: {
                    bg_color: '#0D1117',
                    text_color: '#FFFFFF',
                    hint_color: 'rgba(255, 255, 255, 0.6)',
                    link_color: '#00D4FF',
                    button_color: '#30D158',
                    button_text_color: '#FFFFFF'
                },
                initDataUnsafe: {
                    user: {
                        id: 123456789,
                        first_name: 'Demo',
                        last_name: 'User',
                        username: 'demouser',
                        language_code: 'en'
                    }
                },
                sendData: (data) => console.log('Sending data to bot:', data)
            }
        };
    }

    setupMainButton() {
        if (!this.tg) return;

        this.tg.MainButton.text = "Send Analysis";
        this.tg.MainButton.color = "#30D158";
        this.tg.MainButton.textColor = "#FFFFFF";
        
        this.tg.MainButton.onClick(() => {
            this.handleMainButtonClick();
        });

        // Show main button when there's text in the input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    this.tg.MainButton.show();
                } else {
                    this.tg.MainButton.hide();
                }
            });
        }
    }

    setupBackButton() {
        if (!this.tg) return;

        this.tg.BackButton.onClick(() => {
            this.handleBackButtonClick();
        });
    }

    handleMainButtonClick() {
        // Send the current message
        const messageInput = document.getElementById('messageInput');
        if (messageInput && messageInput.value.trim()) {
            if (window.cboChat) {
                window.cboChat.sendMessage();
            }
            this.tg.MainButton.hide();
        }
    }

    handleBackButtonClick() {
        // Handle navigation or close app
        if (confirm('Are you sure you want to exit?')) {
            this.tg.close();
        }
    }

    getUserData() {
        if (!this.tg || !this.tg.initDataUnsafe) return;

        const user = this.tg.initDataUnsafe.user;
        if (user) {
            console.log('Telegram user:', user);
            // Customize experience based on user data
            this.personalizeExperience(user);
        }
    }

    personalizeExperience(user) {
        // Update UI with user's name
        const welcomeCard = document.querySelector('.welcome-title');
        if (welcomeCard && user.first_name) {
            welcomeCard.textContent = `Welcome ${user.first_name} to BroVerse Business`;
        }
    }

    handleThemeChanges() {
        if (!this.tg) return;

        const theme = this.tg.colorScheme; // 'light' or 'dark'
        document.body.classList.add(`theme-${theme}`);

        // Apply Telegram theme params
        if (this.tg.themeParams) {
            const root = document.documentElement;
            const params = this.tg.themeParams;

            // Map Telegram theme to CSS variables
            if (params.bg_color) {
                root.style.setProperty('--telegram-bg', params.bg_color);
            }
            if (params.text_color) {
                root.style.setProperty('--telegram-text', params.text_color);
            }
            if (params.hint_color) {
                root.style.setProperty('--telegram-hint', params.hint_color);
            }
            if (params.link_color) {
                root.style.setProperty('--telegram-link', params.link_color);
            }
            if (params.button_color) {
                root.style.setProperty('--telegram-button', params.button_color);
            }
        }
    }

    sendDataToBot(data) {
        if (!this.tg) {
            console.log('Would send to bot:', data);
            return;
        }

        // Send data back to the Telegram bot
        this.tg.sendData(JSON.stringify(data));
    }

    showAlert(message) {
        if (!this.tg) {
            alert(message);
            return;
        }

        this.tg.showAlert(message);
    }

    showConfirm(message, callback) {
        if (!this.tg) {
            callback(confirm(message));
            return;
        }

        this.tg.showConfirm(message, callback);
    }

    hapticFeedback(type = 'light') {
        if (!this.tg || !this.tg.HapticFeedback) return;

        switch(type) {
            case 'light':
                this.tg.HapticFeedback.impactOccurred('light');
                break;
            case 'medium':
                this.tg.HapticFeedback.impactOccurred('medium');
                break;
            case 'heavy':
                this.tg.HapticFeedback.impactOccurred('heavy');
                break;
            case 'success':
                this.tg.HapticFeedback.notificationOccurred('success');
                break;
            case 'warning':
                this.tg.HapticFeedback.notificationOccurred('warning');
                break;
            case 'error':
                this.tg.HapticFeedback.notificationOccurred('error');
                break;
            case 'selection':
                this.tg.HapticFeedback.selectionChanged();
                break;
        }
    }
}

// Initialize Telegram integration
document.addEventListener('DOMContentLoaded', () => {
    window.telegramIntegration = new TelegramIntegration();
});