# Next.js Node.js Deployment Instructions

## Overview
This is a **normal Next.js build** that runs with Node.js and includes:
- ✅ Working API routes
- ✅ Server-side rendering
- ✅ Session management
- ✅ Full Next.js functionality

## Files Included
- `server.js` - Next.js server entry point
- `package.json` - Dependencies
- `startup.sh` - Startup script
- `.htaccess` - URL rewriting
- `.next/` - Build output
- `public/` - Static files

## Deployment Steps

### 1. Upload Files
Upload all files from `./Deploy/2025-07-11/frontend-nodejs` to your cPanel public_html/game/ directory:

```bash
# Upload via cPanel File Manager or FTP
- server.js
- package.json  
- startup.sh
- .htaccess
- .next/ (entire directory)
- public/ (entire directory)
```

### 2. Configure Node.js Application in cPanel
1. **Go to cPanel → Node.js**
2. **Create New Application**:
   - Node.js Version: 18.x or higher
   - Application Mode: Production
   - Application Root: public_html/game
   - Application URL: /game
   - Application Startup File: server.js
   - Port: 3000

3. **Environment Variables**:
   - NODE_ENV: production
   - PORT: 3000
   - NEXT_PUBLIC_API_URL: https://www.apanner.com
   - NEXT_PUBLIC_BASE_PATH: /game

### 3. Install Dependencies
In cPanel Node.js interface:
```bash
npm install --production
```

### 4. Start Application
Click **Start** in cPanel Node.js interface

### 5. Verify Deployment
- Frontend: https://www.apanner.com/game/
- API Test: Check browser console for working API routes
- Create Game: Should work without redirects

## Troubleshooting

### If Application Won't Start:
1. Check Node.js logs in cPanel
2. Verify port 3000 is available
3. Check file permissions (644 for files, 755 for directories)

### If API Routes Don't Work:
1. Verify Node.js application is running
2. Check .htaccess file is uploaded
3. Test API endpoints directly

### If Static Files Don't Load:
1. Check .next/static directory exists
2. Verify .htaccess rules for static files
3. Check browser network tab for 404s

## Benefits of This Build
- ✅ **Working API Routes**: All /api/* routes work
- ✅ **Server-Side Rendering**: Better performance
- ✅ **Session Management**: Proper session handling
- ✅ **Full Next.js Features**: No limitations

## Production URLs
- Frontend: https://www.apanner.com/game/
- Backend API: https://www.apanner.com/api/

## Support
If you encounter issues:
1. Check cPanel Node.js logs
2. Verify environment variables
3. Test API endpoints individually
4. Check browser console for errors

This build should resolve all the redirect and session management issues!
