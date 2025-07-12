#!/bin/bash
# Startup script for Next.js application

# Set environment
export NODE_ENV=production
export PORT=3000

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
  npm install --production
fi

# Start the application
echo "Starting Next.js application on port 3000..."
node server.js
