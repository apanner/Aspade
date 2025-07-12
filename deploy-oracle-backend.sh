#!/bin/bash

# Oracle Cloud Infrastructure Backend Deployment Script
# Run this script on your OCI instance after cloning the repository

set -e

echo "🚀 Starting Oracle Cloud Backend Deployment..."
echo "============================================="

# Check if we're in the right directory
if [ ! -f "server/server.js" ]; then
    echo "❌ Error: server/server.js not found. Please run this script from the project root."
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
sudo dnf update -y || sudo apt update -y

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    # For Oracle Linux
    if command -v dnf &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo dnf install -y nodejs
    # For Ubuntu/Debian
    elif command -v apt &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    echo "✅ Node.js is already installed: $(node --version)"
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is already installed: $(pm2 --version)"
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/games
mkdir -p data/players  
mkdir -p data/player_profiles
mkdir -p data/game_history
mkdir -p logs

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install --production
cd ..

# Stop any existing backend processes
echo "🛑 Stopping existing backend processes..."
pm2 stop aspade-backend 2>/dev/null || true
pm2 delete aspade-backend 2>/dev/null || true

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
pm2 start server/server.js --name aspade-backend --env production

# Configure PM2 to start on system boot
echo "🔧 Configuring PM2 startup..."
pm2 startup || true
pm2 save

# Configure firewall for backend port
echo "🔥 Configuring firewall..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3000/tcp || true
    sudo firewall-cmd --reload || true
    echo "✅ Firewall configured for port 3000"
fi

# Test backend
echo "🧪 Testing backend..."
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend is running and healthy!"
else
    echo "❌ Backend health check failed"
    pm2 logs aspade-backend --lines 10
    exit 1
fi

# Show status
echo "📊 Backend deployment completed!"
echo "================================="
echo "🌐 Backend URL: http://$(curl -s ifconfig.me):3000"
echo "🏥 Health Check: http://$(curl -s ifconfig.me):3000/health"
echo "📋 PM2 Status:"
pm2 status
echo ""
echo "📝 Useful commands:"
echo "  - View logs: pm2 logs aspade-backend"
echo "  - Restart: pm2 restart aspade-backend"
echo "  - Stop: pm2 stop aspade-backend"
echo "  - Status: pm2 status" 