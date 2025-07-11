
# Backend Deployment Instructions

## Files Generated
- Backend files: ./Deploy/2025-07-11/server

## Step 1: Upload Backend Files to cPanel

### Method 1: Direct Upload
1. Zip the ./Deploy/2025-07-11/server folder
2. Login to cPanel File Manager
3. Navigate to /apannerc/server (create if doesn't exist)
4. Upload and extract the ZIP file
5. Verify all files are present:
   - server.js
   - package.json
   - .htaccess
   - startup.sh
   - games/ (directory)
   - players/ (directory)
   - player_profiles/ (directory)
   - game_history/ (directory)

## Step 2: Configure Node.js App in cPanel

### Via cPanel Node.js App Manager:
1. Log into cPanel
2. Go to "Node.js App" in Software section
3. Click "Create Application"
4. Configuration:
   - Node.js Version: 16.x or higher (NOT 18.x if having issues)
   - Application Mode: Production
   - Application Root: /apannerc/server
   - Application URL: Leave empty or use "server" 
   - Application startup file: server.js
   - Environment variables:
     - NODE_ENV: production
     - PORT: (leave empty - cPanel will assign)

5. Click "Create"
6. In the app interface, click "Run NPM Install"
7. Wait for installation to complete
8. Click "Start" to run the application

### IMPORTANT: Check Application Status
- Make sure status shows "Running" 
- Check the application logs for any errors
- Note the assigned port number

## Step 2: Configure API Access

To make the backend accessible at https://www.apanner.com, add this to your main .htaccess:

```apache
RewriteEngine On

# Proxy API requests to Node.js app
RewriteCond %{REQUEST_URI} ^/api/(.*)
RewriteRule ^api/(.*)$ http://localhost:[NODE_PORT]/$1 [P,L]

# Replace [NODE_PORT] with the actual port assigned by cPanel
```

## Step 3: Test Backend

### Test URLs (replace with your actual domain):
1. **Health Check**: https://www.apanner.com/health
2. **API Root**: https://www.apanner.com/api  
3. **Server Root**: https://www.apanner.com/
4. **Game Creation**: https://www.apanner.com/api/create
5. **Admin Panel**: https://www.apanner.com/api/admin/games

### Expected Responses:
- `/health` should return: `{"status":"ok","activeGames":0,"uptime":...}`
- `/api` should return: `{"message":"Spades Game API Server","status":"running",...}`
- `/` should return: `{"message":"Spades Game API Server","status":"running",...}`

### If you get "Cannot GET /api" error:
1. Check if Node.js app is running in cPanel
2. Verify the application status is "Running"
3. Check application logs for errors
4. Restart the Node.js application

## Environment Variables:
- NODE_ENV: production
- PORT: (assigned by cPanel automatically)

## File Structure on cPanel:
```
/apannerc/server/
├── server.js (main application file)
├── package.json (dependencies)
├── .htaccess (Apache configuration)
├── startup.sh (startup script)
├── games/ (game data directory)
├── players/ (player data directory)
├── player_profiles/ (player profiles)
└── game_history/ (game history)
```

## Troubleshooting:

### 1. "Cannot GET /api" Error:
- **Cause**: Node.js app is not running
- **Fix**: Go to cPanel → Node.js Apps → Start your application

### 2. "404 Not Found" Error:
- **Cause**: Routes not configured properly
- **Fix**: Check if server.js was modified correctly during deployment

### 3. "Internal Server Error" (500):
- **Cause**: Server crash or dependency issues
- **Fix**: Check application logs, verify dependencies installed

### 4. App won't start:
- **Cause**: Missing dependencies or wrong Node.js version
- **Fix**: Run "NPM Install" in cPanel, try different Node.js version

### 5. Permission Issues:
- **Cause**: File permissions incorrect
- **Fix**: Set file permissions to 644 for files, 755 for directories

### Common cPanel Node.js Issues:
- Use Node.js 16.x instead of 18.x if having compatibility issues
- Make sure "Application Mode" is set to "Production"
- Verify the "Application Root" path is correct
- Check that the startup file is "server.js"
- Ensure environment variables are set correctly
