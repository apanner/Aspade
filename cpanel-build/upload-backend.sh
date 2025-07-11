#!/bin/bash
# Backend Upload Script

echo "🚀 Uploading Backend to cPanel..."

# Configuration
CPANEL_USER="apannerc"
CPANEL_HOST="www.apanner.com"
BACKEND_LOCAL="./cpanel-build/backend"
BACKEND_REMOTE="/apannerc/server"

# Upload backend files
echo "📤 Uploading backend files..."
scp -r "$BACKEND_LOCAL"/* "$CPANEL_USER@$CPANEL_HOST:$BACKEND_REMOTE/"

echo "✅ Backend upload completed!"
echo "🔧 Next steps:"
echo "   1. Set up Node.js app in cPanel"
echo "   2. Install dependencies with 'npm install'"
echo "   3. Start the Node.js application"
echo "   4. Test API endpoints"
