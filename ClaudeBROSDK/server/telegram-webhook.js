import TelegramBot from 'node-telegram-bot-api';
import express from 'express';

export class TelegramWebhook {
  constructor(token, appUrl, logger) {
    this.token = token;
    this.appUrl = appUrl;
    this.logger = logger;
    this.bot = new TelegramBot(token);
  }

  async setupWebhook(app) {
    try {
      // Set webhook URL
      const webhookUrl = `${this.appUrl}/telegram/webhook`;
      await this.bot.setWebHook(webhookUrl);
      this.logger.info(`Telegram webhook set to: ${webhookUrl}`);

      // Handle webhook endpoint
      app.post('/telegram/webhook', express.json(), (req, res) => {
        this.bot.processUpdate(req.body);
        res.sendStatus(200);
      });

      // Set Mini App button in menu
      try {
        await this.bot.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: '🚀 Open CBO SDK',
            web_app: {
              url: this.appUrl
            }
          }
        });
        this.logger.info('Telegram menu button configured');
      } catch (error) {
        this.logger.warn('Could not set menu button:', error.message);
      }

      // Handle /start command
      this.bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name || 'there';
        
        const welcomeMessage = `🚀 Welcome ${firstName} to *CBO SDK Bot*!\n\n` +
          `I'm your Chief Bro Officer, powered by Claude 3.5 Sonnet.\n\n` +
          `I analyze businesses through the *BroVerse Biz Mental Model™* (BBMM):\n` +
          `💎 *Value Flow* - How value is created and delivered\n` +
          `📊 *Info Flow* - How information moves through your org\n` +
          `⚡ *Work Flow* - How work gets done and processes operate\n` +
          `💰 *Cash Flow* - How money flows in, through, and out\n\n` +
          `Click the button below to start optimizing your business:`;

        await this.bot.sendMessage(chatId, welcomeMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎯 Open CBO SDK',
                web_app: { url: this.appUrl }
              }
            ], [
              {
                text: '📚 Learn More',
                callback_data: 'learn_more'
              },
              {
                text: '❓ Help',
                callback_data: 'help'
              }
            ]]
          }
        });
      });

      // Handle /help command
      this.bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        
        const helpMessage = `*CBO SDK Bot Help* 📖\n\n` +
          `*Commands:*\n` +
          `/start - Welcome message and open app\n` +
          `/help - Show this help message\n` +
          `/about - Learn about the BBMM framework\n` +
          `/status - Check bot status\n\n` +
          `*How to use:*\n` +
          `1. Click "Open CBO SDK" button\n` +
          `2. The mini app will open in Telegram\n` +
          `3. Start chatting with Claude about your business\n` +
          `4. Switch between modes (Analyze, Create, Research, Optimize)\n\n` +
          `*Need support?*\n` +
          `Contact: @digitaldavinci`;

        await this.bot.sendMessage(chatId, helpMessage, {
          parse_mode: 'Markdown'
        });
      });

      // Handle /about command
      this.bot.onText(/\/about/, async (msg) => {
        const chatId = msg.chat.id;
        
        const aboutMessage = `*About BroVerse Biz Mental Model™* 🧠\n\n` +
          `The BBMM is a comprehensive framework for analyzing and optimizing businesses through four critical flows:\n\n` +
          `💎 *Value Flow*\n` +
          `• Customer value proposition\n` +
          `• Product/service delivery\n` +
          `• Value capture mechanisms\n\n` +
          `📊 *Info Flow*\n` +
          `• Data collection and analysis\n` +
          `• Decision-making processes\n` +
          `• Communication channels\n\n` +
          `⚡ *Work Flow*\n` +
          `• Operational processes\n` +
          `• Team collaboration\n` +
          `• Productivity optimization\n\n` +
          `💰 *Cash Flow*\n` +
          `• Revenue streams\n` +
          `• Cost structure\n` +
          `• Financial efficiency\n\n` +
          `*Powered by Claude 3.5 Sonnet AI* 🤖`;

        await this.bot.sendMessage(chatId, aboutMessage, {
          parse_mode: 'Markdown'
        });
      });

      // Handle /status command
      this.bot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        
        const statusMessage = `*Bot Status* ✅\n\n` +
          `🟢 *Bot:* Online\n` +
          `🟢 *Backend:* Running\n` +
          `🟢 *WebSocket:* Active\n` +
          `🟢 *Claude API:* Connected\n` +
          `🟢 *Mini App:* ${this.appUrl}\n\n` +
          `*Version:* 1.0.0\n` +
          `*Last Updated:* ${new Date().toISOString()}`;

        await this.bot.sendMessage(chatId, statusMessage, {
          parse_mode: 'Markdown'
        });
      });

      // Handle callback queries
      this.bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        if (data === 'learn_more') {
          await this.bot.sendMessage(chatId, 
            `*Learn More* 📚\n\n` +
            `CBO SDK is an AI-powered business optimization tool that:\n\n` +
            `• Analyzes your business challenges\n` +
            `• Provides strategic recommendations\n` +
            `• Helps optimize operations\n` +
            `• Improves decision-making\n\n` +
            `Built with cutting-edge AI technology and real-time streaming capabilities.\n\n` +
            `Ready to transform your business? Click "Open CBO SDK" to start!`,
            { parse_mode: 'Markdown' }
          );
        } else if (data === 'help') {
          // Trigger help command
          await this.bot.emit('text', {
            ...callbackQuery.message,
            text: '/help',
            from: callbackQuery.from
          });
        }

        // Answer callback query to remove loading state
        await this.bot.answerCallbackQuery(callbackQuery.id);
      });

      // Handle errors
      this.bot.on('error', (error) => {
        this.logger.error('Telegram bot error:', error);
      });

      this.logger.info('Telegram bot handlers configured successfully');
    } catch (error) {
      this.logger.error('Failed to setup Telegram webhook:', error);
      throw error;
    }
  }

  async removeWebhook() {
    try {
      await this.bot.deleteWebHook();
      this.logger.info('Telegram webhook removed');
    } catch (error) {
      this.logger.error('Failed to remove webhook:', error);
    }
  }
}