#!/bin/bash
# cPanel Node.js startup script

echo "🚀 Starting Test Server..."
echo "📍 Working directory: $(pwd)"
echo "📝 Node.js version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Install dependencies
echo "📥 Installing dependencies..."
npm install --production

# Start the server
echo "🟢 Starting server..."
node simple_server.js
