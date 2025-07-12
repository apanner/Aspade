#!/bin/bash

# OCI Deployment Script for A-Spade Game
# This script deploys the application using Docker Compose

set -e

echo "🚀 Starting OCI Deployment..."

# Create data directory
mkdir -p data

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images to save space (optional)
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Check if backend is healthy
echo "🏥 Checking backend health..."
for i in {1..10}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    echo "⏳ Waiting for backend... ($i/10)"
    sleep 10
done

# Check if frontend is accessible
echo "🌐 Checking frontend accessibility..."
for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is accessible!"
        break
    fi
    echo "⏳ Waiting for frontend... ($i/10)"
    sleep 10
done

echo "🎉 Deployment completed!"
echo "🌐 Frontend: http://151.145.43.229:3000"
echo "🔗 Backend: http://151.145.43.229:3001"
echo "🏥 Health Check: http://151.145.43.229:3001/health"

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20 