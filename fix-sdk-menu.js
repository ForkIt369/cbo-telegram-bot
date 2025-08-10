const https = require('https');

const BOT_TOKEN = '8040936127:AAEfiJL_RkauBa_fLa1JmY9L-xPsDVYTuQM';
const WEBAPP_URL = 'https://cbo-mcp-system-hs2sx.ondigitalocean.app/sdk/';

async function setMenuButton() {
  const data = JSON.stringify({
    menu_button: {
      type: 'web_app',
      text: 'Open SDK App',
      web_app: {
        url: WEBAPP_URL
      }
    }
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/setChatMenuButton`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Response:', body);
        resolve(JSON.parse(body));
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getMenuButton() {
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/getChatMenuButton`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Current menu button:', body);
        resolve(JSON.parse(body));
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Setting SDK bot menu button...');
  await setMenuButton();
  
  console.log('\nVerifying menu button...');
  await getMenuButton();
  
  console.log('\nDone! Please restart the Telegram app and check the menu button.');
}

main().catch(console.error);