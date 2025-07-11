@echo off
REM Test Server cPanel Deployment Script (Windows)

echo 🚀 Preparing Test Server for cPanel Upload...

REM Configuration
set CPANEL_USER=apannerc
set CPANEL_HOST=www.apanner.com
set LOCAL_DEPLOY=./deploy
set REMOTE_PATH=/apannerc/api

echo 📦 Building deployment package...
npm run build

echo.
echo 📤 Manual Upload Instructions:
echo ===============================
echo 1. Compress the "deploy" folder into a ZIP file
echo 2. Login to cPanel: https://www.apanner.com/cpanel
echo 3. Go to File Manager
echo 4. Navigate to: %REMOTE_PATH%
echo 5. Upload and extract the ZIP file
echo.
echo 🔧 cPanel Setup:
echo ===============
echo 1. Go to "Node.js Apps" in cPanel
echo 2. Click "Create Application"
echo 3. Configure:
echo    - Node.js Version: 16.x or higher
echo    - Application Root: %REMOTE_PATH%
echo    - Application URL: apanner.com/api
echo    - Startup File: simple_server.js
echo    - Environment: production
echo.
echo 4. Click "Run NPM Install"
echo 5. Click "Start" to run the server
echo.
echo 🌐 Test URLs (after deployment):
echo ===============================
echo https://apanner.com/api/
echo https://apanner.com/api/health
echo https://apanner.com/api/test
echo.
echo 📁 Local files ready in: %LOCAL_DEPLOY%
echo 🏁 Deployment package created successfully!

pause 