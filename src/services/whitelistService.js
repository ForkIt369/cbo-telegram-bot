const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class WhitelistService {
  constructor() {
    this.configPath = path.join(__dirname, '../../config/whitelist.json');
    this.whitelist = null;
    this.loadWhitelist();
  }

  async loadWhitelist() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.whitelist = JSON.parse(data);
      logger.info(`Whitelist loaded: ${this.whitelist.users.length} users, ${this.whitelist.admins.length} admins`);
    } catch (error) {
      logger.error('Failed to load whitelist:', error);
      // Create default whitelist if file doesn't exist
      this.whitelist = {
        users: [],
        admins: []
      };
    }
  }

  async saveWhitelist() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(this.configPath, JSON.stringify(this.whitelist, null, 2));
      logger.info('Whitelist saved successfully');
    } catch (error) {
      logger.error('Failed to save whitelist:', error);
    }
  }

  isWhitelisted(userId) {
    if (!this.whitelist) return false;
    return this.whitelist.users.some(user => user.id === userId);
  }

  isAdmin(userId) {
    if (!this.whitelist) return false;
    return this.whitelist.admins.includes(userId);
  }

  async addUser(userInfo) {
    if (!this.whitelist) await this.loadWhitelist();
    
    // Check if user already exists
    if (this.isWhitelisted(userInfo.id)) {
      return { success: false, message: 'User already whitelisted' };
    }

    const newUser = {
      id: userInfo.id,
      username: userInfo.username || 'N/A',
      first_name: userInfo.first_name || 'N/A',
      added_date: new Date().toISOString().split('T')[0],
      notes: userInfo.notes || ''
    };

    this.whitelist.users.push(newUser);
    await this.saveWhitelist();
    
    return { success: true, message: 'User added to whitelist' };
  }

  async removeUser(userId) {
    if (!this.whitelist) await this.loadWhitelist();
    
    const initialLength = this.whitelist.users.length;
    this.whitelist.users = this.whitelist.users.filter(user => user.id !== userId);
    
    if (this.whitelist.users.length === initialLength) {
      return { success: false, message: 'User not found in whitelist' };
    }

    // Also remove from admins if present
    this.whitelist.admins = this.whitelist.admins.filter(id => id !== userId);
    
    await this.saveWhitelist();
    return { success: true, message: 'User removed from whitelist' };
  }

  async addAdmin(userId) {
    if (!this.whitelist) await this.loadWhitelist();
    
    if (!this.isWhitelisted(userId)) {
      return { success: false, message: 'User must be whitelisted first' };
    }

    if (this.isAdmin(userId)) {
      return { success: false, message: 'User is already an admin' };
    }

    this.whitelist.admins.push(userId);
    await this.saveWhitelist();
    
    return { success: true, message: 'User promoted to admin' };
  }

  async removeAdmin(userId) {
    if (!this.whitelist) await this.loadWhitelist();
    
    if (!this.isAdmin(userId)) {
      return { success: false, message: 'User is not an admin' };
    }

    this.whitelist.admins = this.whitelist.admins.filter(id => id !== userId);
    await this.saveWhitelist();
    
    return { success: true, message: 'Admin privileges removed' };
  }

  getWhitelistedUsers() {
    return this.whitelist ? this.whitelist.users : [];
  }

  getAdmins() {
    return this.whitelist ? this.whitelist.admins : [];
  }
}

module.exports = new WhitelistService();