#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting ClaudeBRO SDK with Telegram Bot...${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from example...${NC}"
    cp server/.env.example server/.env
fi

# Export ANTHROPIC_API_KEY for docker-compose
export ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY server/.env | cut -d '=' -f2)

# Stop any running containers
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
docker-compose -f docker/docker-compose.yml down 2>/dev/null

# Build and start Docker containers
echo -e "${GREEN}🔨 Building Docker containers...${NC}"
docker-compose -f docker/docker-compose.yml build

echo -e "${GREEN}🚀 Starting services...${NC}"
docker-compose -f docker/docker-compose.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Check if services are running
if ! docker-compose -f docker/docker-compose.yml ps | grep -q "Up"; then
    echo -e "${RED}❌ Services failed to start. Check logs with:${NC}"
    echo "docker-compose -f docker/docker-compose.yml logs"
    exit 1
fi

# Setup Telegram bot
echo -e "${GREEN}📱 Setting up Telegram bot...${NC}"
cd server && npm install > /dev/null 2>&1 && cd ..
node scripts/setup-telegram-bot.js

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    docker-compose -f docker/docker-compose.yml down
    echo -e "${GREEN}✅ Services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Show logs command
echo -e "\n${BLUE}📝 View logs:${NC}"
echo "   Backend: docker-compose -f docker/docker-compose.yml logs -f backend"
echo "   Redis:   docker-compose -f docker/docker-compose.yml logs -f redis"
echo "   Ngrok:   docker-compose -f docker/docker-compose.yml logs -f ngrok"

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and follow backend logs
docker-compose -f docker/docker-compose.yml logs -f backend