@echo off
setlocal enabledelayedexpansion

echo 🚀 Deploying A-Spade Frontend to Fly.io...

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

REM Get backend URL (if backend exists)
set BACKEND_URL=
"%FLYCTL%" apps list | findstr "aspade-backend" >nul
if %errorlevel% equ 0 (
    cd server
    for /f "tokens=*" %%i in ('"%FLYCTL%" info --json ^| jq -r ".Hostname"') do set BACKEND_URL=%%i
    cd ..
    echo 🔗 Found backend at: https://!BACKEND_URL!
) else (
    echo ⚠️  Backend app not found. Make sure to deploy backend first!
    set /p BACKEND_URL="Enter backend URL (or press Enter to continue): "
)

REM Check if frontend app exists, create if not
"%FLYCTL%" apps list | findstr "aspade-frontend" >nul
if %errorlevel% neq 0 (
    echo 🆕 Creating new frontend app...
    "%FLYCTL%" apps create aspade-frontend
) else (
    echo 📱 Frontend app already exists
)

REM Set backend URL as secret if provided
if not "!BACKEND_URL!"=="" (
    echo 🔧 Setting backend URL...
    "%FLYCTL%" secrets set NEXT_PUBLIC_API_URL=https://!BACKEND_URL! -a aspade-frontend
)

REM Deploy frontend
echo 🚀 Deploying frontend application...
"%FLYCTL%" deploy

REM Get frontend URL
for /f "tokens=*" %%i in ('"%FLYCTL%" info --json ^| jq -r ".Hostname"') do set FRONTEND_URL=%%i
echo ✅ Frontend deployed successfully!
echo 🌐 Frontend URL: https://!FRONTEND_URL!

echo.
echo 🎉 Deployment completed!
echo 🎮 Play A-Spade at: https://!FRONTEND_URL!
if not "!BACKEND_URL!"=="" (
    echo 🔧 Backend API: https://!BACKEND_URL!
)

echo.
echo 📋 Next steps:
echo 1. Test the game at: https://!FRONTEND_URL!
echo 2. Monitor frontend logs: "%FLYCTL%" logs -a aspade-frontend
echo 3. Monitor backend logs: "%FLYCTL%" logs -a aspade-backend

pause 