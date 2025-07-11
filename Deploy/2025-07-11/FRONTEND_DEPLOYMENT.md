
# Frontend Deployment Instructions

## Files Generated
- Frontend files: ./Deploy/2025-07-11/frontend

## Step 1: Deploy Static Frontend to cPanel

### Upload Static Files:
1. Upload all files from ./Deploy/2025-07-11/frontend to /apannerc/game
2. This is a **static HTML export** - no Node.js required
3. Files can be uploaded via:
   - cPanel File Manager
   - FTP/SFTP client
   - Upload scripts provided

### Configure Web Server:
The .htaccess file has been automatically created with the following features:
- Client-side routing support (SPA routing)
- Static asset caching
- Security headers
- Proper MIME types

### Manual .htaccess Configuration (if needed):
If you need to manually create/update .htaccess in /apannerc/game:
```apache
RewriteEngine On
RewriteBase /game/

# Handle client-side routing for SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /game/index.html [L]

# Cache static assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|ico)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
</FilesMatch>

# Security headers
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
</IfModule>
```

## Step 2: Test Static Frontend

### Basic Testing:
1. Visit: https://www.apanner.com/game/
2. Test navigation between pages
3. Verify static assets load correctly

### API Communication Testing:
1. **Test Page**: Visit https://www.apanner.com/game/api-test.html
   - This page will automatically test backend communication
   - Shows detailed results for each endpoint
   - Helps diagnose frontend-backend connectivity issues

2. **Manual Testing**:
   - Try creating a game: https://www.apanner.com/game/create-game/
   - Try joining a game: https://www.apanner.com/game/join-game/
   - Check browser console for errors

### Expected API Test Results:
- ✅ **Health Check** (/health): Should return server status
- ✅ **API Root** (/api): Should return API endpoints list  
- ✅ **Admin Games** (/api/admin/games): Should return games array
- ✅ **Admin Players** (/api/admin/players): Should return players array
- ✅ **Create Game**: Should successfully create a test game

## File Structure on cPanel:
```
/apannerc/game/
├── index.html          # Main HTML file
├── .htaccess           # Apache configuration
├── _next/
│   ├── static/         # Static assets (CSS, JS, images)
│   └── [chunks]/       # JavaScript chunks
├── game/
│   └── [gameId]/       # Pre-built game pages
└── [other pages]/      # Other static HTML pages
```

## Deployment Type: Static HTML Export
- **No Node.js required** - Pure HTML/CSS/JS
- **No server-side rendering** - All pages pre-built
- **Client-side routing** - Handled by .htaccess
- **API calls** - Made to separate backend server

## Environment Variables (Built-in):
- NEXT_PUBLIC_API_URL: https://www.apanner.com

## Troubleshooting:
- **404 errors**: Check .htaccess file exists and is configured correctly
- **API connection errors**: Verify backend is running at https://www.apanner.com
- **Asset loading issues**: Check basePath configuration
- **Routing issues**: Ensure .htaccess RewriteBase matches deployment path
- **CORS issues**: Verify backend allows requests from frontend domain

## Notes:
- This is a **static export build** - all pages are pre-rendered HTML
- No server-side processing - everything runs in the browser
- All API calls are made to the separate Node.js backend server
- Perfect for cPanel shared hosting (no Node.js hosting required)
