# Oracle Cloud Infrastructure Deployment Guide

This guide will help you deploy your A-Spade game application on Oracle Cloud Infrastructure (OCI).

## 📋 Prerequisites

- **OCI Instance**: VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM)
- **Public IP**: 151.145.43.229
- **SSH Access**: to your OCI instance
- **Git**: installed on your local machine

## 🚀 Quick Start

### 1. Push to Git (Local Machine)
```bash
# Make sure all scripts are executable
chmod +x deploy-oracle-*.sh oracle-utils.sh

# Add and commit the deployment scripts
git add .
git commit -m "Add Oracle Cloud Infrastructure deployment scripts"
git push origin master
```

### 2. Deploy on OCI Instance

#### Option A: Complete Deployment (Recommended)
```bash
# SSH to your OCI instance
ssh -i key/ssh-key-2025-07-12.key opc@151.145.43.229

# Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Run complete deployment
chmod +x deploy-oracle-complete.sh
./deploy-oracle-complete.sh
```

#### Option B: Separate Backend and Frontend Deployment
```bash
# Deploy backend first
chmod +x deploy-oracle-backend.sh
./deploy-oracle-backend.sh

# Then deploy frontend
chmod +x deploy-oracle-frontend.sh
./deploy-oracle-frontend.sh
```

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Oracle Cloud Infrastructure                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              VM.Standard.E2.1.Micro                     │ │
│  │                                                         │ │
│  │  ┌─────────────┐    ┌─────────────┐                    │ │
│  │  │   Backend   │    │  Frontend   │                    │ │
│  │  │   Port 3000 │    │   Port 3001 │                    │ │
│  │  │   (API)     │◄──►│   (Web UI)  │                    │ │
│  │  └─────────────┘    └─────────────┘                    │ │
│  │                                                         │ │
│  │  ┌─────────────┐    ┌─────────────┐                    │ │
│  │  │    PM2      │    │    Data     │                    │ │
│  │  │  Process    │    │  Directory  │                    │ │
│  │  │  Manager    │    │             │                    │ │
│  │  └─────────────┘    └─────────────┘                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Ports
- **Backend**: 3000 (API endpoints)
- **Frontend**: 3001 (Web interface)

### Environment Variables
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=http://151.145.43.229:3000`
- `DEPLOY_TARGET=oracle`

### Data Storage
- **Games**: `data/games/`
- **Players**: `data/players/`
- **Profiles**: `data/player_profiles/`
- **History**: `data/game_history/`

## 🛠️ Management Commands

### Using the Utility Script
```bash
# Make utility script executable
chmod +x oracle-utils.sh

# Check service status
./oracle-utils.sh status

# View logs
./oracle-utils.sh logs          # All logs
./oracle-utils.sh logs backend  # Backend only
./oracle-utils.sh logs frontend # Frontend only

# Restart services
./oracle-utils.sh restart       # All services
./oracle-utils.sh restart backend
./oracle-utils.sh restart frontend

# Stop services
./oracle-utils.sh stop
./oracle-utils.sh stop backend
./oracle-utils.sh stop frontend

# Update application
./oracle-utils.sh update

# Backup data
./oracle-utils.sh backup

# Monitor resources
./oracle-utils.sh monitor
```

### Direct PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs
pm2 logs aspade-backend
pm2 logs aspade-frontend

# Restart services
pm2 restart all
pm2 restart aspade-backend
pm2 restart aspade-frontend

# Stop services
pm2 stop all

# Monitor resources
pm2 monit
```

## 🌐 Access Your Application

After successful deployment:

- **🎮 Game Interface**: http://151.145.43.229:3001
- **🔗 API Backend**: http://151.145.43.229:3000
- **🏥 Health Check**: http://151.145.43.229:3000/health

## 📋 Deployment Scripts

### Main Deployment Scripts
- **`deploy-oracle-complete.sh`**: Complete deployment (backend + frontend)
- **`deploy-oracle-backend.sh`**: Backend only deployment
- **`deploy-oracle-frontend.sh`**: Frontend only deployment

### Utility Scripts
- **`oracle-utils.sh`**: Management utilities
- **`check-status.sh`**: Service status checker
- **`stop-services.sh`**: Service stopper

## 🔄 Update Workflow

To update your application:

1. **Local Machine**: Make changes and push to git
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin master
   ```

2. **OCI Instance**: Pull and redeploy
   ```bash
   ./oracle-utils.sh update
   # OR manually:
   git pull origin master
   ./deploy-oracle-complete.sh
   ```

## 🏥 Health Monitoring

### Automated Health Checks
The deployment includes built-in health checks:
- Backend health endpoint: `/health`
- PM2 process monitoring
- Automatic restarts on failure

### Manual Health Checks
```bash
# Check if services are running
curl http://localhost:3000/health  # Backend
curl http://localhost:3001         # Frontend

# Check system resources
free -h                           # Memory
df -h                            # Disk
pm2 monit                        # Real-time monitoring
```

## 🔥 Firewall Configuration

The deployment scripts automatically configure firewall rules:
```bash
# Ports opened
sudo firewall-cmd --permanent --add-port=3000/tcp  # Backend
sudo firewall-cmd --permanent --add-port=3001/tcp  # Frontend
sudo firewall-cmd --reload
```

## 🛡️ Security Considerations

1. **OCI Security Groups**: Ensure your OCI security groups allow:
   - Port 3000 (Backend API)
   - Port 3001 (Frontend Web)
   - Port 22 (SSH)

2. **Data Protection**: Game data is stored in the `data/` directory
3. **Log Management**: Logs are rotated by PM2
4. **Process Management**: PM2 ensures services restart on failure

## 📊 Performance Optimization

For your 1GB RAM instance:
- **Memory limits**: 512MB per service
- **Process monitoring**: PM2 restarts on memory overflow
- **Log rotation**: Automatic log management
- **Resource monitoring**: Built-in monitoring tools

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   sudo lsof -i :3000  # Check port 3000
   sudo lsof -i :3001  # Check port 3001
   ```

2. **Memory issues**:
   ```bash
   free -h             # Check memory
   pm2 monit           # Monitor processes
   ```

3. **Permission errors**:
   ```bash
   chmod +x *.sh       # Make scripts executable
   ```

4. **Service failures**:
   ```bash
   pm2 logs            # Check logs
   pm2 restart all     # Restart services
   ```

### Emergency Recovery
```bash
# Stop all services
pm2 stop all

# Clean restart
pm2 delete all
./deploy-oracle-complete.sh
```

## 📈 Monitoring and Maintenance

### Regular Maintenance
```bash
# Weekly backup
./oracle-utils.sh backup

# Check service health
./oracle-utils.sh status

# Update application
./oracle-utils.sh update
```

### Log Management
```bash
# View recent logs
pm2 logs --lines 50

# Clear old logs
pm2 flush
```

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs`
2. Verify service status: `pm2 status`
3. Check system resources: `free -h`
4. Review firewall settings: `sudo firewall-cmd --list-all`

## 🎯 Success Metrics

After deployment, you should see:
- ✅ Both services running in PM2
- ✅ Backend health check returns 200
- ✅ Frontend accessible via web browser
- ✅ Memory usage under 800MB
- ✅ Services automatically restart on failure

Your A-Spade game is now live at: **http://151.145.43.229:3001** 