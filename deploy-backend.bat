@echo off
setlocal enabledelayedexpansion

echo 🚀 Deploying A-Spade Backend to Fly.io...

REM Set flyctl path
set FLYCTL=C:\Users\aMegaPC\.fly\bin\flyctl.exe

REM Check if flyctl is installed
if not exist "%FLYCTL%" (
    echo ❌ flyctl is not installed. Please install it first:
    echo https://fly.io/docs/getting-started/installing-flyctl/
    pause
    exit /b 1
)

REM Check if user is logged in
"%FLYCTL%" auth whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  You need to log in to Fly.io first:
    echo flyctl auth login
    pause
    exit /b 1
)

echo ✅ flyctl is installed and you're logged in

REM Navigate to server directory
cd server

REM Check if app exists, create if not
"%FLYCTL%" apps list | findstr "aspade-backend" >nul
if %errorlevel% neq 0 (
    echo 🆕 Creating new backend app...
    "%FLYCTL%" apps create aspade-backend
    
    REM Create volume for persistent data
    echo 💾 Creating volume for data persistence...
    "%FLYCTL%" volumes create aspade_data --region iad --size 1
) else (
    echo 📱 Backend app already exists
)

REM Deploy backend
echo 🚀 Deploying backend application...
"%FLYCTL%" deploy

REM Get backend URL
for /f "tokens=*" %%i in ('"%FLYCTL%" info --json ^| jq -r ".Hostname"') do set BACKEND_URL=%%i
echo ✅ Backend deployed successfully!
echo 🌐 Backend URL: https://!BACKEND_URL!
echo 🔍 Health check: https://!BACKEND_URL!/health

echo.
echo 📋 Next steps:
echo 1. Test the backend: curl https://!BACKEND_URL!/health
echo 2. Deploy the frontend with: deploy-frontend.bat
echo 3. Monitor logs: "%FLYCTL%" logs -a aspade-backend

cd ..
pause 