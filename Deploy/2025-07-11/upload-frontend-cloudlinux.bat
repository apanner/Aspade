@echo off
echo ==========================================
echo   CloudLinux Next.js Frontend Upload
echo ==========================================
echo.
echo IMPORTANT: This is a CloudLinux-compatible build
echo - NO node_modules folder included
echo - Works with CloudLinux NodeJS Selector
echo - Includes working API routes
echo.
echo Manual Upload Steps:
echo.
echo 1. Open cPanel File Manager
echo 2. Navigate to: public_html/game/
echo 3. CLEAR the directory (delete old files if any)
echo 4. Upload ALL files from: frontend-nodejs-cloudlinux/
echo.
echo Files to upload:
echo   ✓ .next/ (entire directory)
echo   ✓ public/ (entire directory)  
echo   ✓ frontend-app.js
echo   ✓ package.json
echo   ✓ .htaccess
echo   ✓ .env.production
echo   ✓ startup.sh
echo.
echo ⚠️  DO NOT upload any node_modules folder!
echo.
echo 5. After upload, follow CloudLinux deployment steps:
echo    - Go to cPanel → Node.js
echo    - Create new application
echo    - Set startup file: frontend-app.js
echo    - Install dependencies via NodeJS Selector
echo    - Start the application
echo.
echo 📖 Detailed instructions: CLOUDLINUX_NODEJS_DEPLOYMENT.md
echo.
echo 🎯 Expected result: Working game with API routes!
echo.
pause 