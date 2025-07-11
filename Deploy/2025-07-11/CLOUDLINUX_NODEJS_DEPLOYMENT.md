# CloudLinux NodeJS Deployment Instructions

## Overview
This is a **CloudLinux-compatible Next.js build** that works with CloudLinux NodeJS Selector:
- ✅ **NO node_modules folder** in application root
- ✅ **Working API routes** for game functionality
- ✅ **Session management** with enhanced fallbacks
- ✅ **CloudLinux NodeJS Selector** compatible
- ✅ **Full Next.js functionality**

## Files Included
- `server.js` - Next.js server entry point
- `package.json` - Dependencies manifest  
- `.next/` - Complete Next.js build with API routes
- `public/` - Static assets
- `.htaccess` - URL rewriting rules
- `.env.production` - Environment variables

## CloudLinux Deployment Steps

### 1. Upload Application Files
Upload all files from `frontend-nodejs-cloudlinux/` to your cPanel directory:

**Target Location**: `public_html/game/`

**Files to Upload**:
```
public_html/game/
├── .next/                  (entire directory)
├── public/                 (entire directory)  
├── frontend-app.js
├── package.json
├── .htaccess
├── .env.production
└── startup.sh
```

**⚠️ IMPORTANT**: Do NOT upload any `node_modules` folder!

### 2. Configure CloudLinux NodeJS Application

#### Step 2a: Access NodeJS Selector
1. **Login to cPanel**
2. **Go to**: Software → **Node.js**
3. **Click**: "Create Application"

#### Step 2b: Application Settings
- **Node.js Version**: 18.x or higher
- **Application Mode**: Production  
- **Application Root**: `public_html/game`
- **Application URL**: `/game`
- **Application Startup File**: `frontend-app.js`
- **Environment**: Production

#### Step 2c: Environment Variables
Add these environment variables in NodeJS Selector:
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://www.apanner.com
NEXT_PUBLIC_BASE_PATH=/game
```

### 3. Install Dependencies
In the **NodeJS Selector interface**:

1. **Click**: "Package installation"
2. **Run**: `npm install --production`
3. **Wait**: For installation to complete
4. **Verify**: All packages installed successfully

### 4. Start Application
1. **In NodeJS Selector**: Click **"Run"** or **"Start"**
2. **Wait**: For application to start
3. **Check Status**: Should show "Running"

### 5. Configure URL Rewriting (.htaccess)
The `.htaccess` file should already be uploaded. It contains:

```apache
RewriteEngine On
RewriteBase /game/

# Proxy requests to Node.js application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/game/$1 [P,L]

# Handle static files
RewriteCond %{REQUEST_URI} ^/game/_next/static/
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### 6. Verify Deployment

#### Test Frontend:
- **URL**: https://www.apanner.com/game/
- **Expected**: Login screen loads properly
- **Check**: Browser console for any errors

#### Test API Routes:
- **Test URL**: https://www.apanner.com/game/api/admin/games
- **Expected**: JSON response (not 404)
- **Check**: All API endpoints respond

#### Test Game Creation:
1. **Enter name** and click "Continue as Guest"
2. **Create a game** with any settings
3. **Expected**: Should stay in game lobby (no redirect)
4. **Check**: Browser console shows session save/retrieve logs

## Troubleshooting

### Application Won't Start
**Problem**: NodeJS app shows "Stopped" status

**Solutions**:
1. **Check port**: Ensure port 3000 is available
2. **Check logs**: View application logs in NodeJS Selector
3. **Verify files**: Ensure `server.js` is uploaded correctly
4. **Check permissions**: Files should be 644, directories 755

### API Routes Return 404
**Problem**: `/api/*` endpoints not working

**Solutions**:
1. **Verify build**: Check `.next/server/app/api/` exists
2. **Check rewrite rules**: Verify `.htaccess` is uploaded
3. **Test directly**: Try `http://localhost:3000/game/api/admin/games`
4. **Check Node.js logs**: Look for startup errors

### Session Management Issues
**Problem**: Redirects back to login after game creation

**Solutions**:
1. **Check browser console**: Look for session management logs
2. **Test localStorage**: Manually check browser storage
3. **Clear browser cache**: Remove old session data
4. **Check environment variables**: Verify basePath is set

### Static Files Not Loading
**Problem**: CSS/JS files return 404

**Solutions**:
1. **Check `.next/static` directory**: Should exist and contain files
2. **Verify .htaccess**: Static file rules should be present
3. **Check permissions**: Ensure files are readable
4. **Test direct access**: Try accessing static files directly

## CloudLinux Specific Notes

### Why No node_modules?
CloudLinux NodeJS Selector manages dependencies via symlinks. The application root should **NOT** contain a `node_modules` folder.

### How Dependencies Work?
1. **package.json**: Lists required dependencies
2. **NodeJS Selector**: Downloads and installs them separately
3. **Symlink**: Created automatically to link dependencies
4. **Application**: Accesses dependencies via the symlink

### Port Configuration
CloudLinux assigns a specific port for your Node.js application. The default port (3000) should work, but check NodeJS Selector if issues occur.

## Expected Results

After successful deployment:
- ✅ **Frontend loads**: https://www.apanner.com/game/
- ✅ **API routes work**: No 404 errors for `/api/*` endpoints
- ✅ **Game creation works**: Stays in game lobby after creation
- ✅ **Join game works**: No redirect loops
- ✅ **Session persistence**: Survives page refreshes
- ✅ **Full functionality**: All game features operational

## Production URLs
- **Frontend**: https://www.apanner.com/game/
- **API Base**: https://www.apanner.com/game/api/
- **Game Creation**: https://www.apanner.com/game/create-game/
- **Dashboard**: https://www.apanner.com/game/dashboard/

## Support

### Application Logs
Check NodeJS Selector interface for:
- **Startup logs**: Application initialization
- **Error logs**: Runtime issues  
- **Access logs**: Request handling

### Common Issues
1. **Port conflicts**: Change port in environment variables
2. **Permission errors**: Check file/directory permissions
3. **Dependency issues**: Reinstall packages via NodeJS Selector
4. **Rewrite failures**: Verify .htaccess syntax

This CloudLinux-compatible build should resolve all session management and API route issues while working within CloudLinux NodeJS Selector requirements! 