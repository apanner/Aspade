@echo off
REM Create ZIP file for cPanel deployment

echo 📦 Creating ZIP file for cPanel upload...

REM Check if deploy folder exists
if not exist "deploy" (
    echo ❌ Deploy folder not found!
    echo Please run "npm run build" first
    pause
    exit /b 1
)

REM Create ZIP file name with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "MIN=%dt:~10,2%" & set "SS=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%MIN%"

set "zipfile=test_server_deploy_%timestamp%.zip"

echo 📁 Creating: %zipfile%

REM Use PowerShell to create ZIP file
powershell -Command "Compress-Archive -Path 'deploy\*' -DestinationPath '%zipfile%' -Force"

if exist "%zipfile%" (
    echo ✅ ZIP file created successfully!
    echo 📤 File: %zipfile%
    echo 📍 Size: 
    for %%I in ("%zipfile%") do echo    %%~zI bytes
    echo.
    echo 🚀 Ready for cPanel upload!
    echo.
    echo Next steps:
    echo 1. Login to cPanel: https://www.apanner.com/cpanel
    echo 2. Go to File Manager
    echo 3. Navigate to /apannerc/api
    echo 4. Upload %zipfile%
    echo 5. Extract the ZIP file
    echo 6. Set up Node.js app in cPanel
) else (
    echo ❌ Failed to create ZIP file
    echo Please check if PowerShell is available
)

pause 