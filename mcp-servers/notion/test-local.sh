#!/bin/bash

# Test script for Notion MCP HTTP wrapper

echo "Testing Notion MCP HTTP wrapper..."
echo "================================="

# Set environment variables
export API_KEY="test-key"
export NOTION_API_KEY="ntn_E6508124073aS6t15BCQppJFDVQhUf6fnmdobvzl7ef0a5"
export PORT=8002

# Start the server in background
echo "Starting Notion MCP server..."
node index.js &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
echo -e "\n1. Testing health endpoint..."
curl -s http://localhost:8002/health | jq .

# Test tool listing
echo -e "\n2. Testing tool listing..."
curl -s -X POST http://localhost:8002/rpc \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }' | jq .

# Test getting bot user info
echo -e "\n3. Testing bot user info..."
curl -s -X POST http://localhost:8002/rpc \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "API-get-self",
      "arguments": {}
    },
    "id": 2
  }' | jq .

# Clean up
echo -e "\nStopping server..."
kill $SERVER_PID

echo -e "\nTest complete!"