#!/bin/bash

echo "🚀 Starting ClaudeBROSDK..."
echo ""

# Check if node_modules exists
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server
    npm install
    cd ..
fi

# Start backend server
echo "🖥️  Starting backend server on port 8082..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend server
echo "🌐 Starting frontend server on port 3000..."
npx serve src -p 3000 &
FRONTEND_PID=$!

echo ""
echo "✅ ClaudeBROSDK is running!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend: http://localhost:8082"
echo "📍 WebSocket: ws://localhost:8084"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait