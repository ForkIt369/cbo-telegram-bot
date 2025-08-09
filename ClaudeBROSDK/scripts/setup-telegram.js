#!/usr/bin/env node

const ngrok = require('ngrok');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '[YOUR_BOT_TOKEN]';
const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN || '[YOUR_NGROK_TOKEN]';
const LOCAL_PORT = 8082;

async function setupTelegramWebhook() {
  try {
    console.log('🚀 Setting up Telegram webhook...');
    
    // Connect to ngrok
    console.log('📡 Creating ngrok tunnel...');
    const url = await ngrok.connect({
      authtoken: NGROK_AUTHTOKEN,
      addr: LOCAL_PORT
    });
    
    console.log(`✅ Ngrok tunnel created: ${url}`);
    
    // Update .env file with the URL
    const envPath = path.join(__dirname, 'server', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/APP_URL=.*/, `APP_URL=${url}`);
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env with APP_URL');
    
    // Set up Telegram webhook
    const webhookUrl = `${url}/telegram/webhook`;
    console.log(`📱 Setting Telegram webhook to: ${webhookUrl}`);
    
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      }
    );
    
    if (response.data.ok) {
      console.log('✅ Telegram webhook set successfully!');
      
      // Set mini app button
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setChatMenuButton`,
        {
          menu_button: {
            type: 'web_app',
            text: '🚀 Open CBO SDK',
            web_app: { url: url }
          }
        }
      );
      console.log('✅ Mini app button configured!');
      
      // Get bot info
      const botInfo = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
      );
      
      console.log('\n🎉 Setup complete!');
      console.log('====================================');
      console.log(`Bot Username: @${botInfo.data.result.username}`);
      console.log(`Public URL: ${url}`);
      console.log(`Webhook URL: ${webhookUrl}`);
      console.log('\n📱 Open Telegram and start chatting with @cbosdkbot');
      console.log('\nPress Ctrl+C to stop the tunnel and exit');
      
      // Keep the process alive
      process.stdin.resume();
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await ngrok.kill();
        console.log('✅ Ngrok tunnel closed');
        process.exit(0);
      });
      
    } else {
      console.error('❌ Failed to set webhook:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  }
}

setupTelegramWebhook();