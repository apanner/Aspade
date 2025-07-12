# Oracle Cloud Infrastructure Deployment Guide

## 📋 Pre-Deployment Checklist

### VM Information
- **Instance**: Instance-20250711-1842
- **Public IP**: 151.145.43.229
- **Private IP**: 10.0.0.236
- **Shape**: VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM)

### Security Groups Configuration
Ensure your OCI Security Group allows:
- **Port 3000**: Frontend access (HTTP)
- **Port 3001**: Backend API access (HTTP)
- **Port 22**: SSH access

---

## 🚀 OPTION 1: Docker Deployment (Recommended)

### Step 1: Transfer Files to OCI
```bash
# From your local machine, compress the project
tar -czf spade-app.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .

# Transfer to OCI (using your private key)
scp -i key/ssh-key-2025-07-12.key spade-app.tar.gz opc@151.145.43.229:~/

# SSH into OCI instance
ssh -i key/ssh-key-2025-07-12.key opc@151.145.43.229

# Extract files
tar -xzf spade-app.tar.gz
cd lite_spade
```

### Step 2: Install Docker
```bash
# Update system
sudo dnf update -y

# Install Docker
sudo dnf install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Deploy with Docker
```bash
# Make deployment script executable
chmod +x deploy-oci.sh

# Run deployment
./deploy-oci.sh
```

### Step 4: Configure Firewall
```bash
# Configure Oracle Linux firewall
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# OR disable firewall for testing (not recommended for production)
sudo systemctl stop firewalld
sudo systemctl disable firewalld
```

---

## 🔧 OPTION 2: Direct Node.js Deployment

### Step 1: Install Node.js
```bash
# Install Node.js and npm
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Setup Application
```bash
# Install dependencies for backend
cd server
npm install
cd ..

# Install dependencies for frontend
npm install

# Build frontend
npm run build
```

### Step 3: Create Startup Scripts
```bash
# Create backend startup script
cat > start-backend.sh << 'EOF'
#!/bin/bash
cd /home/opc/lite_spade/server
export NODE_ENV=production
export PORT=3001
nohup node server.js > backend.log 2>&1 &
echo $! > backend.pid
echo "Backend started with PID: $(cat backend.pid)"
EOF

# Create frontend startup script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd /home/opc/lite_spade
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=http://151.145.43.229:3001
export PORT=3000
nohup npm start > frontend.log 2>&1 &
echo $! > frontend.pid
echo "Frontend started with PID: $(cat frontend.pid)"
EOF

# Make scripts executable
chmod +x start-backend.sh start-frontend.sh
```

### Step 4: Deploy
```bash
# Start backend
./start-backend.sh

# Start frontend
./start-frontend.sh

# Check processes
ps aux | grep node
```

---

## 🔄 OPTION 3: PM2 Process Manager (Production)

### Step 1: Install PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup
pm2 startup
# Follow the instructions provided by the command above
```

### Step 2: Create PM2 Configuration
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'aspade-backend',
      script: 'server/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      log_file: 'logs/backend.log'
    },
    {
      name: 'aspade-frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://151.145.43.229:3001',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      log_file: 'logs/frontend.log'
    }
  ]
}
EOF

# Create logs directory
mkdir -p logs
```

### Step 3: Deploy with PM2
```bash
# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs
```

---

## 🌐 Access Your Application

After successful deployment:

- **Frontend**: http://151.145.43.229:3000
- **Backend API**: http://151.145.43.229:3001
- **Health Check**: http://151.145.43.229:3001/health

---

## 🛠️ Troubleshooting

### Check Service Status
```bash
# For Docker deployment
docker-compose ps
docker-compose logs

# For Node.js deployment
ps aux | grep node
tail -f backend.log frontend.log

# For PM2 deployment
pm2 status
pm2 logs
```

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   sudo lsof -t -i:3000 | xargs sudo kill -9
   
   # Kill process on port 3001
   sudo lsof -t -i:3001 | xargs sudo kill -9
   ```

2. **Permission Denied**
   ```bash
   # Fix file permissions
   chmod +x deploy-oci.sh
   chmod +x start-backend.sh
   chmod +x start-frontend.sh
   ```

3. **Memory Issues (1GB RAM)**
   ```bash
   # Monitor memory usage
   free -h
   top
   
   # Increase swap if needed
   sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

---

## 📊 Monitoring & Maintenance

### View Application Logs
```bash
# Docker logs
docker-compose logs -f

# Direct deployment logs
tail -f backend.log frontend.log

# PM2 logs
pm2 logs
```

### Restart Services
```bash
# Docker restart
docker-compose restart

# PM2 restart
pm2 restart all

# Direct deployment restart
./stop-services.sh && ./start-backend.sh && ./start-frontend.sh
```

### Update Application
```bash
# Transfer new files
scp -i key/ssh-key-2025-07-12.key spade-app.tar.gz opc@151.145.43.229:~/

# Extract and redeploy
tar -xzf spade-app.tar.gz
cd lite_spade
./deploy-oci.sh  # For Docker
# OR
pm2 restart all  # For PM2
```

---

## 🔒 Security Considerations

1. **Configure OCI Security Groups** to allow only necessary ports
2. **Use HTTPS** with SSL certificates (Let's Encrypt)
3. **Setup regular backups** of game data
4. **Monitor resource usage** due to limited 1GB RAM
5. **Setup log rotation** to prevent disk space issues

---

## 📈 Performance Optimization

With 1GB RAM, consider:
- Use Docker with resource limits
- Enable Node.js memory optimization
- Setup log rotation
- Monitor memory usage regularly 