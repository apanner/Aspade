#!/bin/bash

# Oracle Cloud Infrastructure Complete Deployment Script
# Run this script on your OCI instance after cloning the repository

set -e

echo "🚀 Starting Oracle Cloud Complete Deployment..."
echo "=============================================="
echo "This script will deploy both backend and frontend"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server/server.js" ]; then
    echo "❌ Error: Required files not found. Please run this script from the project root."
    exit 1
fi

# Get server IP for API URL
SERVER_IP=$(curl -s ifconfig.me)
echo "🌐 Server IP detected: $SERVER_IP"
echo ""

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

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/games
mkdir -p data/players  
mkdir -p data/player_profiles
mkdir -p data/game_history
mkdir -p logs

echo ""
echo "🔧 DEPLOYING BACKEND..."
echo "======================"

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pm2 stop aspade-backend 2>/dev/null || true
pm2 delete aspade-backend 2>/dev/null || true

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install --production
cd ..

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
pm2 start server/server.js --name aspade-backend --env production

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

echo ""
echo "🎨 DEPLOYING FRONTEND..."
echo "======================="

# Stop any existing frontend processes
echo "🛑 Stopping existing frontend processes..."
pm2 stop aspade-frontend 2>/dev/null || true
pm2 delete aspade-frontend 2>/dev/null || true

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install --production

# Build frontend with proper environment
echo "🔨 Building frontend..."
export NODE_ENV=production
export NEXT_PUBLIC_API_URL="http://$SERVER_IP:3000"
export DEPLOY_TARGET=oracle
npm run build

# Create PM2 ecosystem file for both services
echo "📝 Creating PM2 configuration..."
cat > ecosystem.oracle.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'aspade-backend',
      script: 'server/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      log_file: 'logs/backend.log',
      time: true
    },
    {
      name: 'aspade-frontend',
      script: 'npm',
      args: 'start',
      cwd: '$(pwd)',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://$SERVER_IP:3000',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      log_file: 'logs/frontend.log',
      time: true
    }
  ]
}
EOF

# Restart with new configuration
echo "🔄 Restarting services with new configuration..."
pm2 delete all || true
pm2 start ecosystem.oracle.config.js

# Configure PM2 to start on system boot
echo "🔧 Configuring PM2 startup..."
pm2 startup || true
pm2 save

# Configure firewall
echo "🔥 Configuring firewall..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3000/tcp || true
    sudo firewall-cmd --permanent --add-port=3001/tcp || true
    sudo firewall-cmd --reload || true
    echo "✅ Firewall configured for ports 3000 and 3001"
fi

# Test frontend
echo "🧪 Testing frontend..."
sleep 10
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend is running and accessible!"
else
    echo "❌ Frontend accessibility test failed"
    pm2 logs aspade-frontend --lines 10
fi

# Final status
echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo "🌐 Frontend URL: http://$SERVER_IP:3001"
echo "🔗 Backend API: http://$SERVER_IP:3000"
echo "🏥 Health Check: http://$SERVER_IP:3000/health"
echo ""
echo "📋 PM2 Status:"
pm2 status
echo ""
echo "📝 Useful commands:"
echo "  - View all logs: pm2 logs"
echo "  - View backend logs: pm2 logs aspade-backend"
echo "  - View frontend logs: pm2 logs aspade-frontend"
echo "  - Restart all: pm2 restart all"
echo "  - Stop all: pm2 stop all"
echo "  - Status: pm2 status"
echo "  - Monitor: pm2 monit"
echo ""
echo "🔧 To update your application:"
echo "  git pull origin master"
echo "  ./deploy-oracle-complete.sh"
echo ""
echo "🎯 Your Spade game is now live at: http://$SERVER_IP:3001" 