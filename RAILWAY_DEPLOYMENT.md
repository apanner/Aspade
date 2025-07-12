# Railway Deployment Guide

This guide provides instructions for deploying the Aspade application to [Railway](https://railway.app/).

## Project Structure

- `/` (root) - Frontend application (Next.js)
- `/serv` - Backend application (Node.js/Express)

## Prerequisites

1. [Node.js](https://nodejs.org/) (v14 or higher)
2. Railway CLI (`npm install -g @railway/cli`)
3. Railway account (sign up at [railway.app](https://railway.app/))

## Deployment Options

### Option 1: Using the Deployment Scripts

We've provided three deployment scripts for your convenience:

#### For Windows:
```
deploy-railway.bat
```

#### For macOS/Linux:
```
./deploy-railway.sh
```

#### Using Node.js (cross-platform):
```
node deploy-railway.js
```

These scripts will:
1. Check if Railway CLI is installed
2. Verify you're logged in to Railway
3. Set up the Aspade project
4. Deploy both backend and frontend services with proper environment variables
5. Link the backend URL to the frontend service automatically
6. Provide a deployment summary

### Option 2: Manual Deployment

If you prefer to deploy manually or need more control:

#### 1. Install Railway CLI
```
npm install -g @railway/cli
```

#### 2. Login to Railway
```
railway login
```

#### 3. Create or select project
```
railway project
```

#### 4. Deploy Backend
```
cd serv
railway link
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway up --service backend
```

#### 5. Get the backend URL
```
railway status --service backend
```

#### 6. Deploy Frontend
```
cd ..  # Return to root directory
railway link
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set NEXT_PUBLIC_API_URL=<backend-url-from-step-5>
railway up --service frontend
```

## Environment Variables

The deployment scripts automatically set these environment variables:

### Backend Service
- `NODE_ENV`: "production"
- `PORT`: "3001"

### Frontend Service
- `NODE_ENV`: "production"
- `PORT`: "3000"
- `NEXT_PUBLIC_API_URL`: URL of the backend service

If you need to add custom environment variables:

1. Go to the Railway dashboard
2. Select your project
3. Select the service (frontend or backend)
4. Go to the "Variables" tab
5. Add your variables

## Service Organization

The deployment creates a single Railway project called "Aspade" with two services:
- `frontend`: The Next.js application (from root directory)
- `backend`: The Express server (from /serv directory)

This organization allows:
- Shared project settings
- Independent service scaling
- Service-specific environment variables
- Automatic linking between services

## Troubleshooting

### Common Issues

1. **Deployment fails with "Not authorized"**
   - Run `railway login` to authenticate

2. **Service crashes immediately after deployment**
   - Check the logs in the Railway dashboard
   - Ensure your code handles the `PORT` environment variable

3. **Changes not reflected after deployment**
   - Make sure you've committed your changes
   - Try deploying again with `railway up --service <service-name>`

4. **Environment variables not working**
   - Verify variables are set correctly in the Railway dashboard
   - Check that your code is accessing them properly

### Getting Help

If you encounter issues not covered here:

1. Check the [Railway documentation](https://docs.railway.app/)
2. Visit the [Railway Discord community](https://discord.com/invite/railway)

## Accessing Your Deployed Services

After successful deployment, you can access your services:

1. Visit the [Railway dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on the service you want to access
4. Use the generated domain or set up a custom domain

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Reference](https://docs.railway.app/reference/cli)
- [Railway GitHub Repository](https://github.com/railwayapp/cli) 