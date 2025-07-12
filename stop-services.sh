#!/bin/bash

# Stop Services Script for OCI Deployment

echo "🛑 Stopping all services..."

# Stop Docker services if running
if command -v docker-compose &> /dev/null; then
    echo "Stopping Docker containers..."
    docker-compose down --remove-orphans 2>/dev/null || true
fi

# Stop PM2 services if running
if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || true
fi

# Stop direct Node.js processes
if [ -f backend.pid ]; then
    echo "Stopping backend process..."
    kill $(cat backend.pid) 2>/dev/null || true
    rm -f backend.pid
fi

if [ -f frontend.pid ]; then
    echo "Stopping frontend process..."
    kill $(cat frontend.pid) 2>/dev/null || true
    rm -f frontend.pid
fi

# Kill any remaining Node.js processes on ports 3000 and 3001
echo "Killing processes on ports 3000 and 3001..."
sudo lsof -t -i:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -t -i:3001 | xargs sudo kill -9 2>/dev/null || true

echo "✅ All services stopped!" 