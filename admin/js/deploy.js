// Deployment Functions

let deploymentHistory = [];
let currentDeployment = null;

// Load deployment status
async function loadDeploymentStatus() {
    try {
        const status = await deployAPI.getStatus();
        
        // Update current deployment info
        if (status.current) {
            updateCurrentDeployment(status.current);
        }
        
        // Load deployment history
        const history = await deployAPI.getHistory();
        updateDeploymentHistory(history);
        
    } catch (error) {
        console.error('Failed to load deployment status:', error);
    }
}

// Update current deployment display
function updateCurrentDeployment(deployment) {
    currentDeployment = deployment;
    
    setFieldValue('currentVersion', deployment.version || 'v2.0.0');
    setFieldValue('deployDate', formatDate(deployment.deployed_at));
    setFieldValue('currentModel', formatModelName(deployment.model));
    
    // Update status badge
    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.textContent = deployment.status || 'Active';
        statusBadge.className = `status-badge ${deployment.status === 'Active' ? 'active' : ''}`;
    }
}

// Update deployment history display
function updateDeploymentHistory(history) {
    deploymentHistory = history;
    
    const historyEl = document.getElementById('deployHistory');
    if (!historyEl) return;
    
    if (!history || history.length === 0) {
        historyEl.innerHTML = '<p class="no-history">No deployment history available</p>';
        return;
    }
    
    historyEl.innerHTML = history.map(item => `
        <div class="history-item">
            <span class="history-version">${item.version}</span>
            <span class="history-date">${formatDate(item.deployed_at)}</span>
            <span class="history-user">@${item.deployed_by}</span>
            ${item.version !== currentDeployment?.version ? 
                `<button class="btn-small" onclick="rollback('${item.version}')">Rollback</button>` : 
                '<span class="current-badge">Current</span>'}
        </div>
    `).join('');
}

// Validate configuration before deployment
async function validateConfig() {
    try {
        showLoading('Validating configuration...');
        
        // Get current config
        const config = {
            model_settings: {
                provider: getFieldValue('provider'),
                model: getFieldValue('model'),
                temperature: parseFloat(getFieldValue('temperature')),
                max_tokens: parseInt(getFieldValue('maxTokens')),
                timeout: parseInt(getFieldValue('timeout'))
            },
            system_prompt: getFieldValue('systemPrompt'),
            flow_keywords: currentConfig?.flow_keywords
        };
        
        // Basic validation
        const errors = [];
        
        if (!config.system_prompt || config.system_prompt.length < 50) {
            errors.push('System prompt is too short (minimum 50 characters)');
        }
        
        if (config.model_settings.temperature < 0 || config.model_settings.temperature > 1) {
            errors.push('Temperature must be between 0 and 1');
        }
        
        if (config.model_settings.max_tokens < 100 || config.model_settings.max_tokens > 4000) {
            errors.push('Max tokens must be between 100 and 4000');
        }
        
        hideLoading();
        
        if (errors.length > 0) {
            showNotification('Validation failed: ' + errors[0], 'error');
            return false;
        }
        
        showNotification('Configuration validated successfully', 'success');
        return true;
        
    } catch (error) {
        hideLoading();
        handleError(error);
        return false;
    }
}

// Deploy to production
async function deployProduction() {
    // Validate first
    const isValid = await validateConfig();
    if (!isValid) return;
    
    // Confirm deployment
    if (!confirm('Are you sure you want to deploy to production? This will affect all users immediately.')) {
        return;
    }
    
    try {
        showLoading('Deploying to production...');
        
        // Save configuration first
        await saveConfig();
        
        // Get user info
        const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
        
        // Deploy
        const result = await deployAPI.deploy('production');
        
        hideLoading();
        
        if (result.success) {
            showNotification('Successfully deployed to production!', 'success');
            
            // Update deployment info
            updateCurrentDeployment({
                version: result.version || 'v2.1.0',
                deployed_at: new Date(),
                deployed_by: user.username,
                model: getFieldValue('model'),
                status: 'Active'
            });
            
            // Clear pending changes
            const pendingEl = document.getElementById('pendingChanges');
            if (pendingEl) {
                pendingEl.innerHTML = '<p class="no-changes">No pending changes</p>';
            }
            
            // Reload deployment history
            loadDeploymentStatus();
        } else {
            throw new Error(result.error || 'Deployment failed');
        }
        
    } catch (error) {
        hideLoading();
        handleError(error);
    }
}

// Rollback to previous version
async function rollback(version) {
    if (!confirm(`Are you sure you want to rollback to ${version}? This will revert all configuration changes.`)) {
        return;
    }
    
    try {
        showLoading(`Rolling back to ${version}...`);
        
        const result = await deployAPI.rollback(version);
        
        hideLoading();
        
        if (result.success) {
            showNotification(`Successfully rolled back to ${version}`, 'success');
            
            // Reload configuration
            await loadConfig();
            
            // Reload deployment status
            loadDeploymentStatus();
        } else {
            throw new Error(result.error || 'Rollback failed');
        }
        
    } catch (error) {
        hideLoading();
        handleError(error);
    }
}

// Create backup
async function createBackup() {
    try {
        showLoading('Creating backup...');
        
        // Export current config as backup
        const config = currentConfig || {
            model_settings: {
                provider: getFieldValue('provider'),
                model: getFieldValue('model'),
                temperature: parseFloat(getFieldValue('temperature')),
                max_tokens: parseInt(getFieldValue('maxTokens')),
                timeout: parseInt(getFieldValue('timeout'))
            },
            system_prompt: getFieldValue('systemPrompt'),
            flow_keywords: currentConfig?.flow_keywords
        };
        
        const backupData = {
            version: currentDeployment?.version || 'backup',
            created_at: new Date().toISOString(),
            config: config
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const fileName = `cbo-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', fileName);
        linkElement.click();
        
        hideLoading();
        showNotification('Backup created successfully', 'success');
        
    } catch (error) {
        hideLoading();
        handleError(error);
    }
}

// Format date for display
function formatDate(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}