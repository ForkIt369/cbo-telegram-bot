// Telegram Authentication Handler

// Admin user IDs - must match whitelist.json admins
const ADMIN_IDS = [359511525, 224668466]; // W3_DV and properukrainian

// Check if user is authenticated on page load
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    
    if (!token || !userStr) {
        // Not logged in, redirect to login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = '/admin/login.html';
        }
        return false;
    }
    
    try {
        const user = JSON.parse(userStr);
        
        // Verify user is still an admin
        if (!ADMIN_IDS.includes(user.id)) {
            logout();
            return false;
        }
        
        // Check token expiry (24 hours)
        const tokenData = parseJWT(token);
        if (tokenData.exp && tokenData.exp * 1000 < Date.now()) {
            logout();
            return false;
        }
        
        // Update UI with user info
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.first_name || user.username;
        }
        if (document.getElementById('userId')) {
            document.getElementById('userId').textContent = `@${user.username}`;
        }
        
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        logout();
        return false;
    }
}

// Handle Telegram authentication callback
function onTelegramAuth(user) {
    console.log('Telegram auth received:', user);
    
    // Verify user is an admin
    if (!ADMIN_IDS.includes(user.id)) {
        showError('Access denied. You are not authorized to access the admin panel.');
        return;
    }
    
    // Send auth data to backend
    fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.token) {
            // Store auth data
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(user));
            
            // Redirect to dashboard
            window.location.href = '/admin/';
        } else {
            throw new Error('No token received');
        }
    })
    .catch(error => {
        console.error('Auth error:', error);
        showError('Authentication failed. Please try again.');
    });
}

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminConfig');
    
    // Redirect to login
    window.location.href = '/admin/login.html';
}

// Show error message on login page
function showError(message) {
    const errorEl = document.getElementById('loginError');
    const messageEl = document.getElementById('errorMessage');
    
    if (errorEl && messageEl) {
        messageEl.textContent = message;
        errorEl.style.display = 'flex';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

// Parse JWT token (basic implementation)
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to parse JWT:', error);
        return {};
    }
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Verify authentication before making API calls
function verifyAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        logout();
        return false;
    }
    return true;
}