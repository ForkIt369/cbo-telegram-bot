#!/bin/bash

echo "🚀 Starting ClaudeBRO SDK (Local Test)..."
echo "====================================="

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:8082 | xargs kill -9 2>/dev/null

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
sleep 2

echo ""
echo "✅ Server started successfully!"
echo "====================================="
echo "📍 Open in browser: http://localhost:8082"
echo "📍 WebSocket: ws://localhost:8082/ws"
echo ""
echo "Test the following:"
echo "1. Open http://localhost:8082 in your browser"
echo "2. The ClaudeBRO SDK interface should load"
echo "3. Try sending a message to test the WebSocket connection"
echo ""
echo "Press Ctrl+C to stop"

# Cleanup function
cleanup() {
    echo "\n🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    redis-cli shutdown 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handler
trap cleanup INT TERM

# Wait
wait