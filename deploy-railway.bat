@echo off
setlocal EnableDelayedExpansion

echo.
echo === Railway Deployment Script ===
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Railway CLI not found. Installing...
    call npm install -g @railway/cli
)

REM Check if user is logged in
echo Checking Railway login status...
railway whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Not logged in to Railway. Please login:
    call railway login
)

REM Create or link to project
echo.
echo Setting up project Aspade...
call railway project

REM Deploy backend
echo.
echo Deploying Backend (serv)...
cd serv
call railway link
call railway variables set NODE_ENV=production
call railway variables set PORT=3001
call railway up --service backend
set BACKEND_STATUS=%ERRORLEVEL%
cd ..

REM Get backend URL for frontend environment
for /f "tokens=*" %%a in ('railway status --service backend ^| findstr https://') do (
    set BACKEND_URL=%%a
)
echo Backend URL: !BACKEND_URL!

REM Deploy frontend (root directory)
echo.
echo Deploying Frontend (root)...
call railway link
call railway variables set NODE_ENV=production
call railway variables set PORT=3000
if defined BACKEND_URL (
    call railway variables set NEXT_PUBLIC_API_URL=!BACKEND_URL!
)
call railway up --service frontend
set FRONTEND_STATUS=%ERRORLEVEL%

REM Summary
echo.
echo === Deployment Summary ===
if %BACKEND_STATUS% EQU 0 (
    echo Backend: Success
) else (
    echo Backend: Failed
)

if %FRONTEND_STATUS% EQU 0 (
    echo Frontend: Success
) else (
    echo Frontend: Failed
)

if %BACKEND_STATUS% EQU 0 if %FRONTEND_STATUS% EQU 0 (
    echo.
    echo All services deployed successfully!
    echo.
    echo Visit the Railway dashboard for more details: https://railway.app/dashboard
) else (
    echo.
    echo Some services failed to deploy. Check the logs above for details.
)

endlocal 