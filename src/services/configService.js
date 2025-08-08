const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ConfigService {
    constructor() {
        this.configPath = path.join(__dirname, '../../admin/config');
        this.activeConfigFile = path.join(this.configPath, 'active.json');
        this.historyFile = path.join(this.configPath, 'history.json');
        this.deploymentsFile = path.join(this.configPath, 'deployments.json');
        
        // Default configuration
        this.defaultConfig = {
            version: 'v2.0.0',
            model_settings: {
                provider: 'anthropic',
                model: 'claude-3-sonnet-20240229',
                temperature: 0.7,
                max_tokens: 1000,
                timeout: 30000
            },
            system_prompt: `You are CBO-Bro, Chief Business Optimization expert using the BroVerse Biz Mental Model™ (BBMM).

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
4. Keep total response under 1000 characters when possible`,
            flow_keywords: {
                value: ['customer', 'user', 'satisfaction', 'experience', 'retention', 'value', 'service', 'product'],
                info: ['data', 'analytics', 'metrics', 'insights', 'report', 'information', 'analysis', 'intelligence'],
                work: ['process', 'operation', 'efficiency', 'productivity', 'workflow', 'automation', 'optimization'],
                cash: ['revenue', 'cost', 'profit', 'financial', 'cash', 'money', 'budget', 'investment']
            },
            features: {
                enable_mcp_tools: false,
                enable_memory_bank: true,
                enable_analytics: true,
                enable_auto_save: true
            }
        };
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Ensure config directory exists
            await fs.mkdir(this.configPath, { recursive: true });
            
            // Initialize config files if they don't exist
            await this.ensureConfigFiles();
            
            logger.info('ConfigService initialized');
        } catch (error) {
            logger.error('Failed to initialize ConfigService:', error);
        }
    }
    
    async ensureConfigFiles() {
        try {
            // Check if active config exists
            try {
                await fs.access(this.activeConfigFile);
            } catch {
                // Create default active config
                await this.saveConfig(this.defaultConfig);
                logger.info('Created default active configuration');
            }
            
            // Check if history file exists
            try {
                await fs.access(this.historyFile);
            } catch {
                // Create empty history
                await fs.writeFile(this.historyFile, JSON.stringify([], null, 2));
                logger.info('Created empty configuration history');
            }
            
            // Check if deployments file exists
            try {
                await fs.access(this.deploymentsFile);
            } catch {
                // Create initial deployment record
                const initialDeployment = {
                    version: 'v2.0.0',
                    deployed_at: new Date().toISOString(),
                    deployed_by: 'system',
                    environment: 'production',
                    config_hash: this.generateConfigHash(this.defaultConfig),
                    status: 'active'
                };
                await fs.writeFile(this.deploymentsFile, JSON.stringify([initialDeployment], null, 2));
                logger.info('Created initial deployment record');
            }
        } catch (error) {
            logger.error('Error ensuring config files:', error);
            throw error;
        }
    }
    
    async getActiveConfig() {
        try {
            const data = await fs.readFile(this.activeConfigFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Error reading active config:', error);
            return this.defaultConfig;
        }
    }
    
    async saveConfig(config) {
        try {
            // Validate config
            this.validateConfig(config);
            
            // Save to active config
            await fs.writeFile(this.activeConfigFile, JSON.stringify(config, null, 2));
            
            // Add to history
            await this.addToHistory(config);
            
            logger.info('Configuration saved successfully');
            return { success: true };
        } catch (error) {
            logger.error('Error saving config:', error);
            throw error;
        }
    }
    
    async updatePrompt(prompt) {
        try {
            const config = await this.getActiveConfig();
            config.system_prompt = prompt;
            await this.saveConfig(config);
            return { success: true };
        } catch (error) {
            logger.error('Error updating prompt:', error);
            throw error;
        }
    }
    
    async addToHistory(config) {
        try {
            const history = await this.getHistory();
            
            // Add timestamp and version
            const historyEntry = {
                ...config,
                saved_at: new Date().toISOString(),
                hash: this.generateConfigHash(config)
            };
            
            // Keep only last 50 entries
            history.unshift(historyEntry);
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
        } catch (error) {
            logger.error('Error adding to history:', error);
        }
    }
    
    async getHistory() {
        try {
            const data = await fs.readFile(this.historyFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Error reading history:', error);
            return [];
        }
    }
    
    async getDeploymentStatus() {
        try {
            const deployments = await this.getDeploymentHistory();
            const current = deployments.find(d => d.status === 'active');
            
            return {
                current,
                last_deployment: deployments[0],
                total_deployments: deployments.length
            };
        } catch (error) {
            logger.error('Error getting deployment status:', error);
            return {
                current: null,
                last_deployment: null,
                total_deployments: 0
            };
        }
    }
    
    async getDeploymentHistory() {
        try {
            const data = await fs.readFile(this.deploymentsFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Error reading deployment history:', error);
            return [];
        }
    }
    
    async deploy(environment, deployedBy) {
        try {
            const config = await this.getActiveConfig();
            const deployments = await this.getDeploymentHistory();
            
            // Create new deployment record
            const deployment = {
                version: this.generateVersion(),
                deployed_at: new Date().toISOString(),
                deployed_by: deployedBy,
                environment,
                config_hash: this.generateConfigHash(config),
                status: 'active',
                config_snapshot: config
            };
            
            // Mark previous deployments as inactive
            deployments.forEach(d => {
                if (d.environment === environment) {
                    d.status = 'inactive';
                }
            });
            
            // Add new deployment
            deployments.unshift(deployment);
            
            // Keep only last 100 deployments
            if (deployments.length > 100) {
                deployments = deployments.slice(0, 100);
            }
            
            await fs.writeFile(this.deploymentsFile, JSON.stringify(deployments, null, 2));
            
            logger.info(`Deployed to ${environment} by ${deployedBy}`);
            return { success: true, version: deployment.version };
        } catch (error) {
            logger.error('Error deploying:', error);
            throw error;
        }
    }
    
    async rollback(version) {
        try {
            const deployments = await this.getDeploymentHistory();
            const deployment = deployments.find(d => d.version === version);
            
            if (!deployment) {
                throw new Error(`Version ${version} not found`);
            }
            
            if (!deployment.config_snapshot) {
                throw new Error(`No configuration snapshot for version ${version}`);
            }
            
            // Restore the configuration
            await this.saveConfig(deployment.config_snapshot);
            
            // Update deployment status
            deployments.forEach(d => {
                d.status = d.version === version ? 'active' : 'inactive';
            });
            
            await fs.writeFile(this.deploymentsFile, JSON.stringify(deployments, null, 2));
            
            logger.info(`Rolled back to version ${version}`);
            return { success: true };
        } catch (error) {
            logger.error('Error rolling back:', error);
            throw error;
        }
    }
    
    validateConfig(config) {
        const errors = [];
        
        // Validate model settings
        if (!config.model_settings) {
            errors.push('Model settings are required');
        } else {
            if (!config.model_settings.provider) {
                errors.push('Provider is required');
            }
            if (!config.model_settings.model) {
                errors.push('Model is required');
            }
            if (config.model_settings.temperature < 0 || config.model_settings.temperature > 1) {
                errors.push('Temperature must be between 0 and 1');
            }
            if (config.model_settings.max_tokens < 100 || config.model_settings.max_tokens > 4000) {
                errors.push('Max tokens must be between 100 and 4000');
            }
        }
        
        // Validate system prompt
        if (!config.system_prompt || config.system_prompt.length < 50) {
            errors.push('System prompt must be at least 50 characters');
        }
        
        if (errors.length > 0) {
            throw new Error('Configuration validation failed: ' + errors.join(', '));
        }
    }
    
    generateConfigHash(config) {
        const crypto = require('crypto');
        const configString = JSON.stringify(config);
        return crypto.createHash('sha256').update(configString).digest('hex').substring(0, 8);
    }
    
    generateVersion() {
        const now = new Date();
        const major = 2;
        const minor = now.getMonth() + 1;
        const patch = now.getDate();
        return `v${major}.${minor}.${patch}`;
    }
    
    // Export configuration for backup
    async exportConfig() {
        try {
            const config = await this.getActiveConfig();
            const deployments = await this.getDeploymentHistory();
            const history = await this.getHistory();
            
            return {
                exported_at: new Date().toISOString(),
                active_config: config,
                recent_deployments: deployments.slice(0, 10),
                recent_history: history.slice(0, 10)
            };
        } catch (error) {
            logger.error('Error exporting config:', error);
            throw error;
        }
    }
    
    // Import configuration from backup
    async importConfig(data) {
        try {
            if (!data.active_config) {
                throw new Error('Invalid import data: missing active_config');
            }
            
            // Validate the imported config
            this.validateConfig(data.active_config);
            
            // Save as active config
            await this.saveConfig(data.active_config);
            
            logger.info('Configuration imported successfully');
            return { success: true };
        } catch (error) {
            logger.error('Error importing config:', error);
            throw error;
        }
    }
}

module.exports = new ConfigService();