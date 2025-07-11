# Test Server - cPanel Deployment

This folder contains the production-ready version of the test server.

## Files:
- `simple_server.js` - Main server file
- `package.json` - Production dependencies
- `.htaccess` - Apache configuration
- `startup.sh` - Server startup script
- `README.md` - This file

## cPanel Deployment Instructions:

### Step 1: Upload Files
1. Compress this entire folder into a ZIP file
2. Login to your cPanel
3. Go to File Manager
4. Navigate to your domain's public folder or subdomain
5. Upload and extract the ZIP file

### Step 2: Set up Node.js App
1. In cPanel, go to "Node.js Apps" or "Setup Node.js App"
2. Click "Create Application"
3. Configure:
   - Node.js Version: 14.x or higher
   - Application Root: /path/to/your/uploaded/files
   - Application URL: your-domain.com/api (or subdomain)
   - Startup File: simple_server.js
   - Environment: production

### Step 3: Install Dependencies
1. In the Node.js app interface, click "Run NPM Install"
2. Or use Terminal: `npm install --production`

### Step 4: Start the Application
1. Click "Start" in the Node.js app interface
2. Or use Terminal: `node simple_server.js`

### Step 5: Test the Server
Visit: https://your-domain.com/api/health

## Environment Variables (if needed):
- PORT: Will be set automatically by cPanel
- NODE_ENV: production

## Troubleshooting:
- Check cPanel Error Logs
- Verify Node.js version compatibility
- Ensure all dependencies are installed
- Check file permissions

## Support:
If you encounter issues, check:
1. cPanel Node.js documentation
2. Server error logs
3. Application logs
