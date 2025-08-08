// Test Console Functions

let testConversation = [];

// Send test message
async function sendTestMessage() {
    const input = document.getElementById('testInput');
    const messagesEl = document.getElementById('testMessages');
    
    if (!input || !messagesEl) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Clear input
    input.value = '';
    
    // Add user message to UI
    addTestMessage(message, 'user');
    
    // Start timing
    const startTime = Date.now();
    
    try {
        // Get current config for testing
        const config = {
            model_settings: {
                provider: getFieldValue('provider'),
                model: getFieldValue('model'),
                temperature: parseFloat(getFieldValue('temperature')),
                max_tokens: parseInt(getFieldValue('maxTokens')),
                timeout: parseInt(getFieldValue('timeout'))
            },
            system_prompt: getFieldValue('systemPrompt') || currentConfig?.system_prompt,
            flow_keywords: currentConfig?.flow_keywords
        };
        
        // Send to test API
        const response = await testAPI.sendMessage(message, config);
        
        // Calculate metrics
        const responseTime = Date.now() - startTime;
        
        // Add assistant response
        addTestMessage(response.response, 'assistant');
        
        // Update metrics
        updateTestMetrics({
            responseTime,
            tokens: response.tokens || Math.ceil(response.response.length / 4),
            flow: response.flow || detectFlow(message),
            model: config.model_settings.model
        });
        
    } catch (error) {
        addTestMessage('Error: ' + error.message, 'error');
        updateTestMetrics({
            responseTime: Date.now() - startTime,
            tokens: 0,
            flow: 'Error',
            model: '-'
        });
    }
}

// Add message to test chat
function addTestMessage(content, role) {
    const messagesEl = document.getElementById('testMessages');
    if (!messagesEl) return;
    
    // Remove welcome message if present
    const welcome = messagesEl.querySelector('.test-welcome');
    if (welcome) {
        welcome.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `test-message ${role}`;
    messageEl.textContent = content;
    
    // Add to conversation
    messagesEl.appendChild(messageEl);
    testConversation.push({ role, content, timestamp: new Date() });
    
    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Clear test chat
function clearTestChat() {
    const messagesEl = document.getElementById('testMessages');
    if (messagesEl) {
        messagesEl.innerHTML = `
            <div class="test-welcome">
                <p>Test your configuration here. Messages sent will use the current unsaved configuration.</p>
            </div>
        `;
    }
    
    testConversation = [];
    
    // Reset metrics
    updateTestMetrics({
        responseTime: '-',
        tokens: '-',
        flow: '-',
        model: '-'
    });
    
    showNotification('Test chat cleared', 'success');
}

// Update test metrics display
function updateTestMetrics(metrics) {
    setMetricValue('responseTime', 
        typeof metrics.responseTime === 'number' ? `${metrics.responseTime}ms` : metrics.responseTime);
    setMetricValue('tokenCount', metrics.tokens);
    setMetricValue('detectedFlow', metrics.flow);
    setMetricValue('testModel', formatModelName(metrics.model));
}

// Set metric value
function setMetricValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

// Format model name for display
function formatModelName(model) {
    if (!model || model === '-') return '-';
    
    const modelNames = {
        'claude-3-opus-20240229': 'Claude 3 Opus',
        'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
        'claude-3-haiku-20240307': 'Claude 3 Haiku'
    };
    
    return modelNames[model] || model;
}

// Detect flow from message
function detectFlow(message) {
    const text = message.toLowerCase();
    
    const flowKeywords = {
        'Value Flow': ['customer', 'user', 'satisfaction', 'experience', 'retention'],
        'Info Flow': ['data', 'analytics', 'metrics', 'insights', 'report'],
        'Work Flow': ['process', 'operation', 'efficiency', 'productivity', 'workflow'],
        'Cash Flow': ['revenue', 'cost', 'profit', 'financial', 'cash', 'money']
    };
    
    let bestMatch = 'Unknown';
    let maxScore = 0;
    
    for (const [flow, keywords] of Object.entries(flowKeywords)) {
        const score = keywords.filter(kw => text.includes(kw)).length;
        if (score > maxScore) {
            maxScore = score;
            bestMatch = flow;
        }
    }
    
    return maxScore > 0 ? bestMatch : 'General';
}

// Set test input with example
function setTestInput(text) {
    const input = document.getElementById('testInput');
    if (input) {
        input.value = text;
        input.focus();
    }
}

// Handle enter key in test input
document.addEventListener('DOMContentLoaded', () => {
    const testInput = document.getElementById('testInput');
    if (testInput) {
        testInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendTestMessage();
            }
        });
    }
});