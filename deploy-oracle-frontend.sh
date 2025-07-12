#!/bin/bash

# Oracle Cloud Infrastructure Frontend Deployment Script
# Run this script on your OCI instance after cloning the repository

set -e

echo "🚀 Starting Oracle Cloud Frontend Deployment..."
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Get server IP for API URL
SERVER_IP=$(curl -s ifconfig.me)
echo "🌐 Server IP detected: $SERVER_IP"

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

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install --production

# Build frontend
echo "🔨 Building frontend..."
export NODE_ENV=production
export NEXT_PUBLIC_API_URL="http://$SERVER_IP:3000"
export DEPLOY_TARGET=oracle
npm run build

# Stop any existing frontend processes
echo "🛑 Stopping existing frontend processes..."
pm2 stop aspade-frontend 2>/dev/null || true
pm2 delete aspade-frontend 2>/dev/null || true

# Create PM2 ecosystem file for frontend
echo "📝 Creating PM2 configuration..."
cat > ecosystem.frontend.config.js << EOF
module.exports = {
  apps: [
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

# Start frontend with PM2
echo "🚀 Starting frontend with PM2..."
pm2 start ecosystem.frontend.config.js

# Configure PM2 to start on system boot
echo "🔧 Configuring PM2 startup..."
pm2 startup || true
pm2 save

# Configure firewall for frontend port
echo "🔥 Configuring firewall..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3001/tcp || true
    sudo firewall-cmd --reload || true
    echo "✅ Firewall configured for port 3001"
fi

# Test frontend
echo "🧪 Testing frontend..."
sleep 10
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend is running and accessible!"
else
    echo "❌ Frontend accessibility test failed"
    pm2 logs aspade-frontend --lines 10
    exit 1
fi

# Show status
echo "📊 Frontend deployment completed!"
echo "================================="
echo "🌐 Frontend URL: http://$SERVER_IP:3001"
echo "🔗 Backend API: http://$SERVER_IP:3000"
echo "📋 PM2 Status:"
pm2 status
echo ""
echo "📝 Useful commands:"
echo "  - View logs: pm2 logs aspade-frontend"
echo "  - Restart: pm2 restart aspade-frontend"
echo "  - Stop: pm2 stop aspade-frontend"
echo "  - Status: pm2 status" 