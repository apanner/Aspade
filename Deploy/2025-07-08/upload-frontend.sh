#!/bin/bash
# Frontend Upload Script

echo "🚀 Uploading Frontend to cPanel..."

# Configuration
CPANEL_USER="apannerc"
CPANEL_HOST="www.apanner.com"
FRONTEND_LOCAL="./Deploy/2025-07-08/frontend"
FRONTEND_REMOTE="/apannerc/game"

# Upload frontend files
echo "📤 Uploading frontend files..."
scp -r "$FRONTEND_LOCAL"/* "$CPANEL_USER@$CPANEL_HOST:$FRONTEND_REMOTE/"

echo "✅ Frontend upload completed!"
echo "🔧 Next steps:"
echo "   1. Test the frontend at https://www.apanner.com/game/"
echo "   2. Verify API connection to backend"
echo "   3. Test game functionality"
