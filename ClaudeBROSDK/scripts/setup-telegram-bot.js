import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

const TELEGRAM_BOT_TOKEN = '8040936127:AAEfiJL_RkauBa_fLa1JmY9L-xPsDVYTuQM';
const BOT_USERNAME = 'cbosdkbot';

async function waitForNgrok(maxAttempts = 30) {
  console.log('⏳ Waiting for ngrok to start...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get('http://localhost:4040/api/tunnels');
      const tunnel = response.data.tunnels.find(t => t.proto === 'https');
      
      if (tunnel) {
        return tunnel.public_url;
      }
    } catch (error) {
      // Ngrok not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.stdout.write('.');
  }
  
  throw new Error('Failed to get ngrok URL after ' + maxAttempts + ' attempts');
}

async function updateEnvFile(appUrl) {
  const envPath = path.join(__dirname, '..', 'server', '.env');
  
  try {
    let envContent = await fs.readFile(envPath, 'utf-8');
    
    // Update or add APP_URL
    if (envContent.includes('APP_URL=')) {
      envContent = envContent.replace(/APP_URL=.*/g, `APP_URL=${appUrl}`);
    } else {
      envContent += `\nAPP_URL=${appUrl}`;
    }
    
    await fs.writeFile(envPath, envContent);
    console.log('✅ Updated .env file with APP_URL');
  } catch (error) {
    console.warn('⚠️  Could not update .env file:', error.message);
  }
}

async function setupBot() {
  try {
    console.log('🚀 Setting up Telegram Bot...\n');
    
    // Get ngrok URL
    const ngrokUrl = await waitForNgrok();
    console.log(`\n✅ Ngrok URL: ${ngrokUrl}`);
    
    // Update .env file
    await updateEnvFile(ngrokUrl);
    
    // Set webhook
    const webhookUrl = `${ngrokUrl}/telegram/webhook`;
    const setWebhookUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
    
    try {
      const response = await axios.post(setWebhookUrl, {
        url: webhookUrl
      });
      
      if (response.data.ok) {
        console.log(`✅ Webhook set to: ${webhookUrl}`);
      } else {
        console.warn('⚠️  Webhook response:', response.data);
      }
    } catch (error) {
      console.error('❌ Failed to set webhook:', error.message);
    }
    
    // Display bot information
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CBO SDK Bot is ready!');
    console.log('='.repeat(60));
    console.log('\n📱 Bot URL: https://t.me/' + BOT_USERNAME);
    console.log('🌐 Mini App URL: ' + ngrokUrl);
    console.log('📊 Ngrok Dashboard: http://localhost:4040');
    console.log('\n💡 Instructions:');
    console.log('1. Open Telegram and go to @' + BOT_USERNAME);
    console.log('2. Send /start to the bot');
    console.log('3. Click "Open CBO SDK" button');
    console.log('4. Start chatting with Claude!');
    console.log('\n' + '='.repeat(60));
    
    // Export for other scripts
    process.env.APP_URL = ngrokUrl;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupBot();
}

export { waitForNgrok, setupBot };