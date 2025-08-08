// Prompt Editor Functions

// Prompt templates
const promptTemplates = {
    bbmm: `You are CBO-Bro, Chief Business Optimization expert using the BroVerse Biz Mental Model™ (BBMM).

Your role is to analyze business challenges through the lens of Four Flows:
1. VALUE FLOW - Customer value creation and delivery
2. INFO FLOW - Data, insights, and decision-making  
3. WORK FLOW - Operations and process efficiency
4. CASH FLOW - Financial health and sustainability

You also consider 12 Core Capabilities and 64 Business Patterns.

When responding:
1. Identify the primary flow(s) affected
2. Provide 2-3 specific, actionable recommendations
3. Suggest immediate next steps
4. Keep total response under {{max_tokens}} characters when possible`,

    sales: `You are CBO-Bro, a sales optimization expert focused on revenue growth.

Analyze sales challenges through:
- Lead generation and qualification
- Conversion optimization
- Customer lifetime value
- Sales process efficiency

Provide actionable insights that directly impact revenue.`,

    support: `You are CBO-Bro, a customer support optimization specialist.

Focus on:
- Response time optimization
- Issue resolution efficiency
- Customer satisfaction metrics
- Support cost reduction

Deliver practical solutions for support excellence.`,

    technical: `You are CBO-Bro, a technical business analyst.

Evaluate technical decisions through:
- System architecture impact
- Scalability considerations
- Cost-benefit analysis
- Implementation complexity

Provide clear technical recommendations aligned with business goals.`
};

// Quick insert templates
const quickTemplates = {
    greeting: 'Always start with a friendly, professional greeting acknowledging the user\'s query.',
    analysis: 'Analyze the situation through the Four Flows framework: Value, Info, Work, and Cash.',
    action: 'Conclude with 2-3 specific, actionable next steps the user can implement immediately.'
};

// Load template into editor
function loadTemplate(templateName) {
    if (!templateName) return;
    
    const template = promptTemplates[templateName];
    if (template) {
        const promptField = document.getElementById('systemPrompt');
        if (promptField) {
            promptField.value = template;
            updatePromptStats();
            updatePromptPreview();
            showNotification(`Loaded ${templateName} template`, 'success');
        }
    }
}

// Insert template snippet
function insertTemplate(templateName) {
    const template = quickTemplates[templateName];
    if (!template) return;
    
    const promptField = document.getElementById('systemPrompt');
    if (promptField) {
        const currentValue = promptField.value;
        const cursorPos = promptField.selectionStart;
        
        // Insert template at cursor position
        const newValue = currentValue.substring(0, cursorPos) + 
                        '\n\n' + template + '\n\n' + 
                        currentValue.substring(cursorPos);
        
        promptField.value = newValue;
        
        // Set cursor after inserted text
        const newPos = cursorPos + template.length + 4;
        promptField.setSelectionRange(newPos, newPos);
        promptField.focus();
        
        updatePromptStats();
        updatePromptPreview();
    }
}

// Insert variable at cursor position
function insertVar(variable) {
    const promptField = document.getElementById('systemPrompt');
    if (!promptField) return;
    
    const currentValue = promptField.value;
    const cursorPos = promptField.selectionStart;
    
    // Insert variable at cursor position
    const newValue = currentValue.substring(0, cursorPos) + 
                    variable + 
                    currentValue.substring(cursorPos);
    
    promptField.value = newValue;
    
    // Set cursor after inserted variable
    const newPos = cursorPos + variable.length;
    promptField.setSelectionRange(newPos, newPos);
    promptField.focus();
    
    updatePromptStats();
    updatePromptPreview();
}

// Update prompt statistics
function updatePromptStats() {
    const promptField = document.getElementById('systemPrompt');
    const charCountEl = document.getElementById('charCount');
    const tokenCountEl = document.getElementById('tokenCount');
    
    if (promptField && charCountEl) {
        const text = promptField.value;
        charCountEl.textContent = text.length;
        
        // Rough token estimation (1 token ≈ 4 characters)
        if (tokenCountEl) {
            tokenCountEl.textContent = Math.ceil(text.length / 4);
        }
    }
}

// Update prompt preview
function updatePromptPreview() {
    const promptField = document.getElementById('systemPrompt');
    const previewEl = document.getElementById('promptPreview');
    
    if (!promptField || !previewEl) return;
    
    let preview = promptField.value;
    
    // Replace variables with example values
    preview = preview.replace(/\{\{user_name\}\}/g, 'John')
                     .replace(/\{\{flow_type\}\}/g, 'Value Flow')
                     .replace(/\{\{context\}\}/g, 'SaaS business optimization')
                     .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString())
                     .replace(/\{\{capabilities\}\}/g, '12 Core Capabilities')
                     .replace(/\{\{max_tokens\}\}/g, '1000');
    
    // Convert line breaks to HTML
    preview = preview.replace(/\n/g, '<br>');
    
    previewEl.innerHTML = preview || '<p>Preview will appear here...</p>';
}

// Save prompt
async function savePrompt() {
    try {
        const prompt = getFieldValue('systemPrompt');
        
        if (!prompt) {
            showNotification('Please enter a system prompt', 'warning');
            return;
        }
        
        showLoading('Saving prompt...');
        
        await promptAPI.save(prompt);
        
        // Update current config
        if (currentConfig) {
            currentConfig.system_prompt = prompt;
        }
        
        hideLoading();
        showNotification('Prompt saved successfully', 'success');
        
        updatePendingChanges();
    } catch (error) {
        handleError(error);
    }
}

// Test prompt with sample message
async function testPrompt() {
    const prompt = getFieldValue('systemPrompt');
    
    if (!prompt) {
        showNotification('Please enter a system prompt to test', 'warning');
        return;
    }
    
    // Switch to test tab
    showTab('test');
    
    // Send test message
    const testInput = document.getElementById('testInput');
    if (testInput) {
        testInput.value = 'How can I improve my customer retention rate?';
        sendTestMessage();
    }
}

// Format prompt (basic formatting)
function formatPrompt() {
    const promptField = document.getElementById('systemPrompt');
    if (!promptField) return;
    
    let text = promptField.value;
    
    // Remove extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+$/gm, '');
    text = text.trim();
    
    // Ensure proper spacing around numbered lists
    text = text.replace(/(\d+\.\s)/g, '\n$1');
    text = text.replace(/\n{3,}/g, '\n\n');
    
    promptField.value = text;
    updatePromptStats();
    updatePromptPreview();
    
    showNotification('Prompt formatted', 'success');
}