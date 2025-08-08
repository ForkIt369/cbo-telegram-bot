// Admin API Client

const API_BASE = '/api/admin';

// API helper functions
async function apiCall(endpoint, options = {}) {
    if (!verifyAuth()) {
        throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        logout();
        throw new Error('Authentication expired');
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
}

// Configuration API
const configAPI = {
    async get() {
        return apiCall('/config');
    },
    
    async save(config) {
        return apiCall('/config', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    },
    
    async getTemplates() {
        return apiCall('/config/templates');
    },
    
    async saveTemplate(name, template) {
        return apiCall('/config/templates', {
            method: 'POST',
            body: JSON.stringify({ name, template })
        });
    }
};

// Prompt API
const promptAPI = {
    async get() {
        return apiCall('/prompt');
    },
    
    async save(prompt) {
        return apiCall('/prompt', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });
    },
    
    async getTemplates() {
        return apiCall('/prompt/templates');
    }
};

// Test API
const testAPI = {
    async sendMessage(message, config) {
        return apiCall('/test', {
            method: 'POST',
            body: JSON.stringify({ message, config })
        });
    },
    
    async getMetrics() {
        return apiCall('/test/metrics');
    }
};

// Deployment API
const deployAPI = {
    async getStatus() {
        return apiCall('/deploy/status');
    },
    
    async deploy(environment = 'production') {
        return apiCall('/deploy', {
            method: 'POST',
            body: JSON.stringify({ environment })
        });
    },
    
    async getHistory() {
        return apiCall('/deploy/history');
    },
    
    async rollback(version) {
        return apiCall('/deploy/rollback', {
            method: 'POST',
            body: JSON.stringify({ version })
        });
    }
};

// Analytics API
const analyticsAPI = {
    async getStats(timeRange = '24h') {
        return apiCall(`/analytics/stats?range=${timeRange}`);
    },
    
    async getFlowDistribution(timeRange = '24h') {
        return apiCall(`/analytics/flows?range=${timeRange}`);
    },
    
    async getUserActivity(timeRange = '24h') {
        return apiCall(`/analytics/users?range=${timeRange}`);
    }
};

// Show loading overlay
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.style.display = 'flex';
    }
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    // Set color based on type
    const colors = {
        success: '#30D158',
        error: '#F85149',
        warning: '#F0883E',
        info: '#58A6FF'
    };
    
    notification.style.background = colors[type] || colors.success;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Handle API errors
function handleError(error) {
    console.error('API Error:', error);
    hideLoading();
    showNotification(error.message || 'An error occurred', 'error');
}