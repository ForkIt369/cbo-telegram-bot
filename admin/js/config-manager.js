// Configuration Manager

let currentConfig = null;

// Load dashboard on page load
async function loadDashboard() {
    if (!checkAuth()) return;
    
    // Load current configuration
    await loadConfig();
    
    // Set up event listeners
    setupEventListeners();
}

// Load configuration from server
async function loadConfig() {
    try {
        showLoading('Loading configuration...');
        currentConfig = await configAPI.get();
        
        // Populate form fields
        populateConfigForm(currentConfig);
        
        hideLoading();
        showNotification('Configuration loaded', 'success');
    } catch (error) {
        handleError(error);
    }
}

// Populate configuration form
function populateConfigForm(config) {
    // Model settings
    if (config.model_settings) {
        setFieldValue('provider', config.model_settings.provider || 'anthropic');
        setFieldValue('model', config.model_settings.model || 'claude-3-sonnet-20240229');
        setFieldValue('temperature', config.model_settings.temperature || 0.7);
        setFieldValue('tempValue', config.model_settings.temperature || 0.7);
        setFieldValue('maxTokens', config.model_settings.max_tokens || 1000);
        setFieldValue('timeout', config.model_settings.timeout || 15000);
    }
    
    // Flow keywords
    if (config.flow_keywords) {
        setFieldValue('valueKeywords', (config.flow_keywords.value || []).join(', '));
        setFieldValue('infoKeywords', (config.flow_keywords.info || []).join(', '));
        setFieldValue('workKeywords', (config.flow_keywords.work || []).join(', '));
        setFieldValue('cashKeywords', (config.flow_keywords.cash || []).join(', '));
    }
    
    // Response settings
    if (config.response_settings) {
        setFieldValue('useMarkdown', config.response_settings.use_markdown);
        setFieldValue('includeSources', config.response_settings.include_sources);
        setFieldValue('responseFormat', config.response_settings.format || 'concise');
    }
    
    // System prompt
    if (config.system_prompt) {
        setFieldValue('systemPrompt', config.system_prompt);
        updatePromptPreview();
    }
}

// Save configuration
async function saveConfig() {
    try {
        showLoading('Saving configuration...');
        
        // Gather form data
        const config = {
            name: 'Production CBO',
            version: '2.1.0',
            model_settings: {
                provider: getFieldValue('provider'),
                model: getFieldValue('model'),
                temperature: parseFloat(getFieldValue('temperature')),
                max_tokens: parseInt(getFieldValue('maxTokens')),
                timeout: parseInt(getFieldValue('timeout'))
            },
            flow_keywords: {
                value: getFieldValue('valueKeywords').split(',').map(k => k.trim()),
                info: getFieldValue('infoKeywords').split(',').map(k => k.trim()),
                work: getFieldValue('workKeywords').split(',').map(k => k.trim()),
                cash: getFieldValue('cashKeywords').split(',').map(k => k.trim())
            },
            response_settings: {
                use_markdown: getFieldValue('useMarkdown'),
                include_sources: getFieldValue('includeSources'),
                format: getFieldValue('responseFormat')
            },
            system_prompt: getFieldValue('systemPrompt')
        };
        
        // Save to server
        await configAPI.save(config);
        currentConfig = config;
        
        hideLoading();
        showNotification('Configuration saved successfully', 'success');
        
        // Update pending changes in deploy tab
        updatePendingChanges();
    } catch (error) {
        handleError(error);
    }
}

// Export configuration
function exportConfig() {
    if (!currentConfig) {
        showNotification('No configuration to export', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(currentConfig, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cbo-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Configuration exported', 'success');
}

// Import configuration
function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const config = JSON.parse(text);
            
            // Validate config structure
            if (!config.model_settings || !config.flow_keywords) {
                throw new Error('Invalid configuration format');
            }
            
            // Apply imported config
            populateConfigForm(config);
            currentConfig = config;
            
            showNotification('Configuration imported successfully', 'success');
        } catch (error) {
            showNotification('Failed to import configuration: ' + error.message, 'error');
        }
    };
    
    input.click();
}

// Update model options based on provider
function updateModelOptions() {
    const provider = getFieldValue('provider');
    const modelSelect = document.getElementById('model');
    
    if (!modelSelect) return;
    
    // Clear current options
    modelSelect.innerHTML = '';
    
    // Add options based on provider
    const models = {
        anthropic: [
            { value: 'claude-3-opus-20240229', text: 'Claude 3 Opus' },
            { value: 'claude-3-sonnet-20240229', text: 'Claude 3 Sonnet' },
            { value: 'claude-3-haiku-20240307', text: 'Claude 3 Haiku' }
        ]
    };
    
    const providerModels = models[provider] || models.anthropic;
    providerModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.text;
        modelSelect.appendChild(option);
    });
}

// Show specific tab
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to selected button
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Load tab-specific data if needed
    if (tabName === 'analytics') {
        loadAnalytics();
    } else if (tabName === 'deploy') {
        loadDeploymentStatus();
    }
}

// Update pending changes display
function updatePendingChanges() {
    const pendingEl = document.getElementById('pendingChanges');
    if (!pendingEl) return;
    
    // Compare current config with saved config
    // For now, just show a simple message
    pendingEl.innerHTML = `
        <div class="change-item">
            <span>Configuration updated</span>
            <span class="change-time">${new Date().toLocaleTimeString()}</span>
        </div>
    `;
}

// Helper functions
function getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return '';
    
    if (field.type === 'checkbox') {
        return field.checked;
    }
    return field.value;
}

function setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    if (field.type === 'checkbox') {
        field.checked = value;
    } else {
        field.value = value;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Temperature slider
    const tempSlider = document.getElementById('temperature');
    if (tempSlider) {
        tempSlider.addEventListener('input', (e) => {
            document.getElementById('tempValue').textContent = e.target.value;
        });
    }
    
    // System prompt character count
    const promptTextarea = document.getElementById('systemPrompt');
    if (promptTextarea) {
        promptTextarea.addEventListener('input', updatePromptStats);
    }
}