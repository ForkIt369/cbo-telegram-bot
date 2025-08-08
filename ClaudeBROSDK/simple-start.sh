#!/bin/bash

echo "🚀 Starting ClaudeBRO SDK Telegram Bot (Simple Mode)..."
echo "====================================="

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:8082 | xargs kill -9 2>/dev/null
killall ngrok 2>/dev/null

# Start Redis
echo "📦 Starting Redis..."
redis-server --daemonize yes

# Start backend server
echo "🔧 Starting server..."
cd server
node index.js &
BACKEND_PID=$!
cd ..

# Wait for server to start
sleep 3

# Start ngrok directly
echo "📡 Starting ngrok tunnel..."
ngrok http 8082 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    kill $BACKEND_PID $NGROK_PID 2>/dev/null
    redis-cli shutdown 2>/dev/null
    exit 1
fi

echo "✅ Ngrok tunnel created: $NGROK_URL"

# Update .env with the URL
sed -i '' "s|APP_URL=.*|APP_URL=$NGROK_URL|" server/.env

# Set Telegram webhook
echo "📱 Setting Telegram webhook..."
curl -s -X POST "https://api.telegram.org/bot8040936127:AAEfiJL_RkauBa_fLa1JmY9L-xPsDVYTuQM/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$NGROK_URL/telegram/webhook\",\"allowed_updates\":[\"message\",\"callback_query\"]}" | grep -q '"ok":true'

if [ $? -eq 0 ]; then
    echo "✅ Telegram webhook set successfully!"
else
    echo "❌ Failed to set Telegram webhook"
fi

# Set mini app button
echo "🎮 Setting mini app button..."
curl -s -X POST "https://api.telegram.org/bot8040936127:AAEfiJL_RkauBa_fLa1JmY9L-xPsDVYTuQM/setChatMenuButton" \
    -H "Content-Type: application/json" \
    -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"🚀 Open CBO SDK\",\"web_app\":{\"url\":\"$NGROK_URL\"}}}" | grep -q '"ok":true'

if [ $? -eq 0 ]; then
    echo "✅ Mini app button configured!"
else
    echo "❌ Failed to set mini app button"
fi

echo ""
echo "🎉 Setup complete!"
echo "====================================="
echo "Bot Username: @cbosdkbot"
echo "Public URL: $NGROK_URL"
echo "Webhook URL: $NGROK_URL/telegram/webhook"
echo ""
echo "📱 Open Telegram and start chatting with @cbosdkbot"
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo "\n🛑 Stopping all services..."
    kill $BACKEND_PID $NGROK_PID 2>/dev/null
    redis-cli shutdown 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handler
trap cleanup INT TERM

# Wait
wait