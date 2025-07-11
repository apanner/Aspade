
# Complete Spades Game Deployment to cPanel

This guide covers deploying both the backend (Node.js) and frontend (Next.js) to cPanel hosting.

## Overview

- **Backend**: Node.js server deployed to `/apannerc/server`
- **Frontend**: Static Next.js app deployed to `/apannerc/game`
- **Backend URL**: https://www.apanner.com/api
- **Frontend URL**: https://www.apanner.com/game/

## Files Generated

- Backend files: `./Deploy/2025-07-08/server`
- Frontend files: `./Deploy/2025-07-08/frontend`
- Backend instructions: `BACKEND_DEPLOYMENT.md`
- Frontend instructions: `FRONTEND_DEPLOYMENT.md`

## Quick Start

### 1. Deploy Backend First

Run the backend upload script:
- **Linux/Mac**: `./upload-backend.sh`
- **Windows**: `upload-backend.bat`

Or upload manually:
1. Upload all files from `./Deploy/2025-07-08/server` to `/apannerc/server`
2. Set up Node.js application in cPanel
3. Install dependencies and start the app

### 2. Deploy Frontend

Run the frontend upload script:
- **Linux/Mac**: `./upload-frontend.sh`
- **Windows**: `upload-frontend.bat`

Or upload manually:
1. Upload all files from `./Deploy/2025-07-08/frontend` to `/apannerc/game`
2. Verify the .htaccess file is properly configured

### 3. Test the Deployment

1. **Backend Health Check**: https://www.apanner.com/api/health
2. **Frontend**: https://www.apanner.com/game/
3. **Full Game Test**: Create and join a game

## Deployment Scripts

### Separate Deployment
You can deploy backend and frontend separately:

```bash
# Deploy only backend
node deploy-backend.js

# Deploy only frontend
node deploy-frontend.js

# Deploy both (this script)
node deploy.js
```

### NPM Scripts
Add these to your package.json:

```json
{
  "scripts": {
    "deploy": "node deploy.js",
    "deploy:backend": "node deploy-backend.js",
    "deploy:frontend": "node deploy-frontend.js"
  }
}
```

## Environment Variables

### Backend
- `NODE_ENV=production`
- `PORT` (assigned by cPanel)

### Frontend
- `NEXT_PUBLIC_API_URL=https://www.apanner.com/api`

## File Structure on cPanel

```
/apannerc/
├── server/              # Backend Node.js app
│   ├── server.js
│   ├── package.json
│   ├── games/
│   ├── players/
│   ├── player_profiles/
│   └── game_history/
└── game/               # Frontend static files
    ├── index.html
    ├── .htaccess
    ├── _next/
    └── [other static files]
```

## Troubleshooting

### Backend Issues
- Check Node.js app logs in cPanel
- Verify environment variables are set
- Test API endpoints directly
- Ensure all dependencies are installed

### Frontend Issues
- Check browser console for errors
- Verify API URLs are correct
- Test static file serving
- Ensure .htaccess is properly configured

### Connection Issues
- Verify backend is running and accessible
- Check CORS configuration
- Test API endpoints with curl/Postman
- Verify frontend can reach backend API

## Next Steps

1. Read the detailed deployment instructions for each component
2. Upload the files to cPanel
3. Configure the backend Node.js application
4. Test all functionality thoroughly
5. Set up monitoring and backups as needed

For detailed instructions, see:
- `BACKEND_DEPLOYMENT.md` for backend-specific details
- `FRONTEND_DEPLOYMENT.md` for frontend-specific details
