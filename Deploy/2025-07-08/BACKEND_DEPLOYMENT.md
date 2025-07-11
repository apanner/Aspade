
# Backend Deployment Instructions

## Files Generated
- Backend files: ./Deploy/2025-07-08/server

## Step 1: Deploy Backend to cPanel

### Via cPanel Node.js App Manager:
1. Log into cPanel
2. Go to "Node.js App" in Software section
3. Click "Create Application"
4. Configuration:
   - Node.js Version: 18.x or higher
   - Application Mode: Production
   - Application Root: /apannerc/server
   - Application URL: Leave empty (will be accessed via API)
   - Application startup file: server.js
   - Environment variables:
     - NODE_ENV: production
     - PORT: (leave empty - cPanel will assign)

### Upload Backend Files:
1. Upload all files from ./Deploy/2025-07-08/server to /apannerc/server
2. In cPanel Node.js App Manager, click "Run NPM Install"
3. Start the application

### Alternative: Manual Upload
1. Zip the ./Deploy/2025-07-08/server folder
2. Upload to cPanel File Manager
3. Extract to /apannerc/server
4. Set up Node.js application as described above

## Step 2: Configure API Access

To make the backend accessible at https://www.apanner.com/api, add this to your main .htaccess:

```apache
RewriteEngine On

# Proxy API requests to Node.js app
RewriteCond %{REQUEST_URI} ^/api/(.*)
RewriteRule ^api/(.*)$ http://localhost:[NODE_PORT]/$1 [P,L]

# Replace [NODE_PORT] with the actual port assigned by cPanel
```

## Step 3: Test Backend

1. Backend Health Check: https://www.apanner.com/api/health
2. Test API endpoints with tools like Postman or curl

## Environment Variables:
- NODE_ENV: production
- PORT: (assigned by cPanel)

## File Structure on cPanel:
```
/apannerc/server/
├── server.js
├── package.json
├── games/
├── players/
├── player_profiles/
└── game_history/
```

## Troubleshooting:
- Check Node.js app logs in cPanel
- Verify environment variables are set
- Ensure all dependencies are installed
- Check server.js file permissions (should be 644)
