# Fly.io Deployment Guide - Separate Frontend & Backend

This guide explains how to deploy your A-Spade game as **two separate applications** on Fly.io:
- **Backend**: Express API server (`aspade-backend`)
- **Frontend**: Next.js web application (`aspade-frontend`)

## 🎯 Deployment Strategy

### Why Separate Applications?

1. **Independent Scaling**: Scale frontend and backend independently
2. **Better Resource Management**: Different resource requirements
3. **Easier Maintenance**: Update components separately
4. **Cost Optimization**: Backend can scale to zero when not in use
5. **Better Monitoring**: Separate logs and metrics

### Architecture Overview

```
┌─────────────────┐    HTTPS/API     ┌─────────────────┐
│   Frontend      │ ────────────────▶│   Backend       │
│   (Next.js)     │                  │   (Express)     │
│   Port: 3000    │                  │   Port: 3001    │
└─────────────────┘                  └─────────────────┘
        │                                     │
        ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│ aspade-frontend │                  │ aspade-backend  │
│ .fly.dev        │                  │ .fly.dev        │
└─────────────────┘                  └─────────────────┘
```

## 📋 Prerequisites

### 1. Install Fly.io CLI
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
pwsh -c "iwr https://fly.io/install.ps1 -useb | iex"
```

### 2. Sign up and Login
```bash
flyctl auth signup  # Create account
flyctl auth login   # Login
```

### 3. Verify Installation
```bash
flyctl version
flyctl auth whoami
```

## 🏗️ Project Structure

Your project now has these deployment files:

```
├── server/
│   ├── fly.toml           # Backend Fly.io config
│   ├── Dockerfile         # Backend Docker config
│   ├── package.json       # Backend dependencies
│   └── server.js          # Express server
├── fly.toml               # Frontend Fly.io config
├── Dockerfile             # Frontend Docker config
├── next.config.ts         # Next.js config (updated)
├── deploy-backend.sh      # Backend deployment script
├── deploy-frontend.sh     # Frontend deployment script
├── deploy-backend.bat     # Backend deployment (Windows)
├── deploy-frontend.bat    # Frontend deployment (Windows)
└── FLYIO_DEPLOYMENT_GUIDE.md  # This guide
```

## 🚀 Deployment Process

### Step 1: Deploy Backend First

The backend must be deployed first because the frontend needs its URL.

**Unix/macOS/Linux:**
```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```

**Windows:**
```batch
deploy-backend.bat
```

**Manual Backend Deployment:**
```bash
cd server
flyctl apps create aspade-backend
flyctl volumes create aspade_data --region iad --size 1
flyctl deploy
```

### Step 2: Deploy Frontend

After backend is deployed, deploy the frontend:

**Unix/macOS/Linux:**
```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

**Windows:**
```batch
deploy-frontend.bat
```

**Manual Frontend Deployment:**
```bash
flyctl apps create aspade-frontend
flyctl secrets set NEXT_PUBLIC_API_URL=https://aspade-backend.fly.dev
flyctl deploy
```

## 🔧 Configuration Details

### Backend Configuration (`server/fly.toml`)

```toml
app = "aspade-backend"
primary_region = "iad"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[mounts]]
  source = "aspade_data"
  destination = "/app/data"
```

**Key Features:**
- ✅ Persistent data storage (1GB volume)
- ✅ Health checks on `/health` endpoint
- ✅ Auto-scaling (scales to 0 when idle)
- ✅ HTTPS enforced

### Frontend Configuration (`fly.toml`)

```toml
app = "aspade-frontend"
primary_region = "iad"

[env]
  NODE_ENV = "production"
  PORT = "3000"
  DEPLOY_TARGET = "flyio"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
```

**Key Features:**
- ✅ Next.js standalone mode
- ✅ Optimized Docker build
- ✅ Environment-aware configuration
- ✅ Auto-scaling

## 🌐 Environment Variables

### Backend Environment Variables
```bash
NODE_ENV=production
PORT=3001
```

### Frontend Environment Variables
```bash
NODE_ENV=production
PORT=3000
DEPLOY_TARGET=flyio
NEXT_PUBLIC_API_URL=https://aspade-backend.fly.dev
```

## 🔍 Testing Your Deployment

### 1. Test Backend
```bash
# Health check
curl https://aspade-backend.fly.dev/health

# Expected response:
# {"status":"ok","activeGames":0,"uptime":123.45}

# Test game creation
curl -X POST https://aspade-backend.fly.dev/api/create \
  -H "Content-Type: application/json" \
  -d '{"hostName":"TestPlayer","gameMode":"teams"}'
```

### 2. Test Frontend
1. Visit `https://aspade-frontend.fly.dev`
2. Enter a player name
3. Create a new game
4. Verify game creation works

### 3. Test Full Integration
1. Create a game on frontend
2. Join with multiple players
3. Start playing and verify real-time updates

## 📊 Monitoring and Management

### View Application Status
```bash
flyctl apps list
flyctl status -a aspade-backend
flyctl status -a aspade-frontend
```

### View Logs
```bash
# Backend logs
flyctl logs -a aspade-backend

# Frontend logs
flyctl logs -a aspade-frontend

# Follow logs in real-time
flyctl logs -a aspade-backend -f
```

### Scale Applications
```bash
# Scale backend
flyctl scale count 2 -a aspade-backend

# Scale frontend
flyctl scale count 2 -a aspade-frontend
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Frontend Can't Connect to Backend
**Problem**: API calls failing with CORS or network errors

**Solution**:
```bash
# Check backend URL
flyctl info -a aspade-backend

# Update frontend environment
flyctl secrets set NEXT_PUBLIC_API_URL=https://your-backend-url.fly.dev -a aspade-frontend

# Redeploy frontend
flyctl deploy -a aspade-frontend
```

#### 2. Backend Data Loss
**Problem**: Game data disappears after deployment

**Solution**:
```bash
# Check if volume exists
flyctl volumes list -a aspade-backend

# Create volume if missing
flyctl volumes create aspade_data --region iad --size 1 -a aspade-backend
```

#### 3. App Name Already Taken
**Problem**: App name conflicts during creation

**Solution**:
```bash
# Use different names
flyctl apps create aspade-backend-yourname
flyctl apps create aspade-frontend-yourname
```

#### 4. Build Failures
**Problem**: Docker build fails

**Solution**:
```bash
# Check build logs
flyctl logs -a aspade-backend

# Try deploying with verbose output
flyctl deploy --verbose -a aspade-backend
```

## 💰 Cost Estimation

### Free Tier Limits
- 3 shared-cpu-1x machines
- 160GB/month bandwidth
- 3GB persistent storage

### Your Setup
- 2 applications (frontend + backend)
- 1GB persistent storage for backend
- Auto-scaling (scales to 0 when idle)

**Estimated Monthly Cost**: $0-15 depending on usage

## 🔄 Updates and Maintenance

### Update Backend
```bash
cd server
flyctl deploy
```

### Update Frontend
```bash
flyctl deploy
```

### Update Environment Variables
```bash
# Update backend environment
flyctl secrets set NEW_VAR=value -a aspade-backend

# Update frontend environment
flyctl secrets set NEXT_PUBLIC_API_URL=https://new-backend-url.fly.dev -a aspade-frontend
```

### Backup Data
```bash
# Create volume snapshot
flyctl volumes snapshots create aspade_data -a aspade-backend

# List snapshots
flyctl volumes snapshots list aspade_data -a aspade-backend
```

## 🌍 Custom Domains (Optional)

### Add Custom Domains
```bash
# Frontend domain
flyctl certs add yourdomain.com -a aspade-frontend

# Backend domain (API subdomain)
flyctl certs add api.yourdomain.com -a aspade-backend
```

### Update DNS Records
```
CNAME yourdomain.com aspade-frontend.fly.dev
CNAME api.yourdomain.com aspade-backend.fly.dev
```

### Update Frontend Configuration
```bash
flyctl secrets set NEXT_PUBLIC_API_URL=https://api.yourdomain.com -a aspade-frontend
```

## 📈 Performance Optimization

### Backend Optimization
- Use persistent volumes for data
- Implement proper caching
- Optimize database queries
- Use connection pooling

### Frontend Optimization
- Enable Next.js optimization features
- Use CDN for static assets
- Implement proper caching headers
- Optimize images and fonts

## 🆘 Support and Resources

### Fly.io Resources
- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Community](https://community.fly.io/)
- [Fly.io Status](https://status.fly.io/)

### Debug Commands
```bash
# SSH into backend
flyctl ssh console -a aspade-backend

# SSH into frontend
flyctl ssh console -a aspade-frontend

# Check app configuration
flyctl config show -a aspade-backend
flyctl config show -a aspade-frontend
```

## 🎯 Next Steps

After successful deployment:

1. **Test thoroughly**: Play complete games
2. **Monitor performance**: Check logs and metrics
3. **Set up monitoring**: Configure alerts
4. **Custom domains**: Add your own domains
5. **Backup strategy**: Regular data backups
6. **Security**: Review and harden settings

## 📱 Your Live Applications

After deployment, your applications will be available at:

- **🎮 Game Frontend**: `https://aspade-frontend.fly.dev`
- **🔧 Backend API**: `https://aspade-backend.fly.dev`
- **👨‍💼 Admin Panel**: `https://aspade-frontend.fly.dev/admin`
- **📊 Health Check**: `https://aspade-backend.fly.dev/health`

---

**🎉 Congratulations!** Your A-Spade game is now running on Fly.io with separate, scalable frontend and backend applications! 