#!/bin/bash

echo "🚀 Starting ClaudeBRO SDK Telegram Bot..."
echo "====================================="

# Kill any existing processes on our port
echo "🧹 Cleaning up existing processes..."
lsof -ti:8082 | xargs kill -9 2>/dev/null

# Start Redis if not running
echo "📦 Starting Redis..."
redis-server --daemonize yes

# Start backend server (now serves frontend and WebSocket too)
echo "🔧 Starting server..."
cd server
node index.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Setup Telegram webhook with ngrok
echo "📱 Setting up Telegram integration..."
node setup-telegram.js &
NGROK_PID=$!

echo ""
echo "✅ All services started!"
echo "====================================="
echo "📍 Server: http://localhost:8082"
echo "📍 WebSocket: ws://localhost:8082/ws"
echo ""
echo "Telegram bot will be available shortly..."
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

# Wait for all background processes
wait