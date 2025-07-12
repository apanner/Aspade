#!/bin/bash

# Service Status Check Script for OCI Deployment

echo "🔍 Checking service status..."
echo "==============================="

# Check if Docker is running
if command -v docker &> /dev/null; then
    echo "🐳 Docker Status:"
    docker-compose ps 2>/dev/null || echo "   No Docker containers running"
    echo ""
fi

# Check if PM2 is running
if command -v pm2 &> /dev/null; then
    echo "🔄 PM2 Status:"
    pm2 status 2>/dev/null || echo "   No PM2 processes running"
    echo ""
fi

# Check ports
echo "🌐 Port Status:"
if netstat -tlnp 2>/dev/null | grep -q :3000; then
    echo "   ✅ Port 3000 is in use"
    netstat -tlnp 2>/dev/null | grep :3000
else
    echo "   ❌ Port 3000 is not in use"
fi

if netstat -tlnp 2>/dev/null | grep -q :3001; then
    echo "   ✅ Port 3001 is in use"
    netstat -tlnp 2>/dev/null | grep :3001
else
    echo "   ❌ Port 3001 is not in use"
fi

echo ""

# Check HTTP endpoints
echo "🏥 Health Checks:"
echo "   Frontend (port 3000):"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "   ✅ Frontend is responding"
else
    echo "   ❌ Frontend is not responding"
fi

echo "   Backend (port 3001):"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200"; then
    echo "   ✅ Backend is responding"
else
    echo "   ❌ Backend is not responding"
fi

echo ""

# Check system resources
echo "💾 System Resources:"
echo "   Memory usage:"
free -h | grep -E "Mem:|Swap:"
echo ""
echo "   Disk usage:"
df -h | grep -v tmpfs | grep -v udev

echo ""
echo "🌍 Access URLs:"
echo "   Frontend: http://151.145.43.229:3000"
echo "   Backend:  http://151.145.43.229:3001"
echo "   Health:   http://151.145.43.229:3001/health" 