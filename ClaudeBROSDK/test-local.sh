#!/bin/bash

# Test script for local development (without Docker)

echo "🧪 Testing ClaudeBRO SDK locally..."

# Start backend server
cd server
npm start &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start frontend
cd ../
npx serve src -p 3000 &
FRONTEND_PID=$!

echo ""
echo "✅ Local test environment running!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend: http://localhost:8082"
echo "📍 WebSocket: ws://localhost:8084"
echo ""
echo "Press Ctrl+C to stop"

trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait