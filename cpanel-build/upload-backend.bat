@echo off
REM Backend Upload Script (Windows)

echo 🚀 Uploading Backend to cPanel...

REM Configuration
set CPANEL_USER=apannerc
set CPANEL_HOST=www.apanner.com
set BACKEND_LOCAL=./cpanel-build/backend
set BACKEND_REMOTE=/apannerc/server

echo 📤 Use an FTP client or cPanel File Manager to upload:
echo    Backend: %BACKEND_LOCAL% → %BACKEND_REMOTE%

echo ✅ Manual upload required on Windows
echo 🔧 After upload:
echo    1. Set up Node.js app in cPanel
echo    2. Install dependencies with npm install
echo    3. Start the Node.js application
echo    4. Test API endpoints

pause
