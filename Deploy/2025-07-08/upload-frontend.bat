@echo off
REM Frontend Upload Script (Windows)

echo 🚀 Uploading Frontend to cPanel...

REM Configuration
set CPANEL_USER=apannerc
set CPANEL_HOST=www.apanner.com
set FRONTEND_LOCAL=./Deploy/2025-07-08/frontend
set FRONTEND_REMOTE=/apannerc/game

echo 📤 Use an FTP client or cPanel File Manager to upload:
echo    Frontend: %FRONTEND_LOCAL% → %FRONTEND_REMOTE%

echo ✅ Manual upload required on Windows
echo 🔧 After upload:
echo    1. Test the frontend at https://www.apanner.com/game/
echo    2. Verify API connection to backend
echo    3. Test game functionality

pause
