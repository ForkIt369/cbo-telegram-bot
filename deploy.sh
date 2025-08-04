#!/bin/bash

# CBO Bot Deployment Script
# This script helps deploy the bot and Mini App to DigitalOcean

echo "🚀 CBO Bot Deployment Script"
echo "============================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the CBO_BOT directory"
    echo "Please run this script from the root of the project"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists git; then
    echo "❌ Git is not installed"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ All prerequisites met"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Please edit .env with your values before deploying"
        exit 1
    else
        echo "❌ No .env.example found"
        exit 1
    fi
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Install Mini App dependencies
echo ""
echo "📦 Installing Mini App dependencies..."
cd mini-app
npm install
cd ..

# Build Mini App
echo ""
echo "🔨 Building Mini App..."
npm run build

# Check if build was successful
if [ ! -d "mini-app/dist" ]; then
    echo "❌ Mini App build failed"
    exit 1
fi

echo "✅ Mini App built successfully"

# Git operations
echo ""
echo "📤 Preparing for deployment..."

# Check if we have uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 You have uncommitted changes:"
    git status -s
    echo ""
    read -p "Do you want to commit all changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    else
        echo "⚠️  Uncommitted changes will not be deployed"
    fi
fi

# Check if we're connected to a remote
if ! git remote -v | grep -q origin; then
    echo "❌ No git remote found"
    echo "Please add your GitHub repository:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    exit 1
fi

# Push to remote
echo ""
echo "🚀 Pushing to GitHub..."
git push origin master

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub"
    echo ""
    echo "🎉 Deployment initiated!"
    echo ""
    echo "DigitalOcean will now:"
    echo "1. Detect the push to master branch"
    echo "2. Build your app (including Mini App)"
    echo "3. Deploy it automatically"
    echo ""
    echo "📊 Monitor deployment at:"
    echo "https://cloud.digitalocean.com/apps"
    echo ""
    echo "🤖 After deployment, set up Mini App in @BotFather:"
    echo "1. Open @BotFather"
    echo "2. Select your bot → Bot Settings → Menu Button"
    echo "3. Set URL to: https://your-app.ondigitalocean.app"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi

echo ""
echo "✨ Deployment script completed!"