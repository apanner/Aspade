#!/bin/bash
# cPanel Node.js startup script for Spades Game Backend

echo "🚀 Starting Spades Game Backend Server..."
echo "📍 Working directory: $(pwd)"
echo "📝 Node.js version: $(node --version)"
echo "📦 NPM version: $(npm --version)"
echo "🌍 Environment: $NODE_ENV"

# List files to verify upload
echo "📁 Files in directory:"
ls -la

# Check if directories exist
echo "📂 Checking data directories..."
for dir in games players player_profiles game_history; do
  if [ -d "$dir" ]; then
    echo "✓ $dir directory exists"
  else
    echo "⚠ $dir directory missing - creating..."
    mkdir -p "$dir"
  fi
done

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install --production
fi

# Start the server
echo "🟢 Starting server..."
NODE_ENV=production node server.js
