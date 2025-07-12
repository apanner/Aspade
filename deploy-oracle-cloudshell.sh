#!/bin/bash

# Oracle Cloud Shell to Compute Instance Deployment Script
# Run this from Oracle Cloud Shell to deploy to your compute instance

set -e

# Configuration
COMPUTE_IP="151.145.43.229"
COMPUTE_USER="opc"
REPO_URL="https://github.com/apanner/Aspade.git"
PROJECT_NAME="Aspade"

echo "🚀 Deploying from Oracle Cloud Shell to Compute Instance..."
echo "============================================================"
echo "🎯 Target Instance: $COMPUTE_IP"
echo "👤 User: $COMPUTE_USER"
echo "📁 Repository: $REPO_URL"
echo ""

# Check if we can reach the compute instance
echo "🔍 Checking connectivity to compute instance..."
if ping -c 1 $COMPUTE_IP > /dev/null 2>&1; then
    echo "✅ Can reach $COMPUTE_IP"
else
    echo "❌ Cannot reach $COMPUTE_IP"
    echo "Please check your compute instance is running and accessible"
    exit 1
fi

# Create deployment script for the compute instance
echo "📝 Creating deployment script for compute instance..."
cat > deploy-remote.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment on compute instance..."
echo "=============================================="

# Update system
echo "📦 Updating system packages..."
sudo dnf update -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo dnf install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Clone or update repository
if [ -d "Aspade" ]; then
    echo "📥 Updating existing repository..."
    cd Aspade
    git pull origin master
else
    echo "📥 Cloning repository..."
    git clone https://github.com/apanner/Aspade.git
    cd Aspade
fi

# Make scripts executable
chmod +x deploy-oracle-*.sh oracle-utils.sh

# Run deployment
echo "🎬 Running deployment script..."
./deploy-oracle-complete.sh

echo "🎉 Deployment completed!"
EOF

# Make the remote script executable
chmod +x deploy-remote.sh

# Copy and execute the script on the compute instance
echo "📤 Copying deployment script to compute instance..."
scp deploy-remote.sh $COMPUTE_USER@$COMPUTE_IP:~/

echo "🎬 Executing deployment on compute instance..."
ssh $COMPUTE_USER@$COMPUTE_IP 'bash ~/deploy-remote.sh'

# Clean up
rm -f deploy-remote.sh

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo "🌐 Your application should now be available at:"
echo "  - Frontend: http://$COMPUTE_IP:3001"
echo "  - Backend:  http://$COMPUTE_IP:3000"
echo "  - Health:   http://$COMPUTE_IP:3000/health"
echo ""
echo "🔧 To manage your application:"
echo "  ssh $COMPUTE_USER@$COMPUTE_IP"
echo "  cd Aspade"
echo "  ./oracle-utils.sh status" 