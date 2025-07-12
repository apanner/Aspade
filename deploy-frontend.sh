#!/bin/bash

# Deploy A-Spade Frontend to Fly.io
echo "🚀 Deploying A-Spade Frontend to Fly.io..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl is not installed. Please install it first:${NC}"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  You need to log in to Fly.io first:${NC}"
    echo "flyctl auth login"
    exit 1
fi

echo -e "${GREEN}✅ flyctl is installed and you're logged in${NC}"

# Get backend URL (if backend exists)
BACKEND_URL=""
if flyctl apps list | grep -q "aspade-backend"; then
    cd server
    BACKEND_URL=$(flyctl info --json | jq -r '.Hostname')
    cd ..
    echo -e "${GREEN}🔗 Found backend at: https://${BACKEND_URL}${NC}"
else
    echo -e "${YELLOW}⚠️  Backend app not found. Make sure to deploy backend first!${NC}"
    read -p "Enter backend URL (or press Enter to continue): " BACKEND_URL
fi

# Check if frontend app exists, create if not
if ! flyctl apps list | grep -q "aspade-frontend"; then
    echo -e "${YELLOW}🆕 Creating new frontend app...${NC}"
    flyctl apps create aspade-frontend
else
    echo -e "${GREEN}📱 Frontend app already exists${NC}"
fi

# Set backend URL as secret if provided
if [ ! -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}🔧 Setting backend URL...${NC}"
    flyctl secrets set NEXT_PUBLIC_API_URL="https://${BACKEND_URL}" -a aspade-frontend
fi

# Deploy frontend
echo -e "${GREEN}🚀 Deploying frontend application...${NC}"
flyctl deploy

# Get frontend URL
FRONTEND_URL=$(flyctl info --json | jq -r '.Hostname')
echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo -e "${GREEN}🌐 Frontend URL: https://${FRONTEND_URL}${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${GREEN}🎮 Play A-Spade at: https://${FRONTEND_URL}${NC}"
if [ ! -z "$BACKEND_URL" ]; then
    echo -e "${GREEN}🔧 Backend API: https://${BACKEND_URL}${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Test the game at: https://${FRONTEND_URL}"
echo "2. Monitor frontend logs: flyctl logs -a aspade-frontend"
echo "3. Monitor backend logs: flyctl logs -a aspade-backend" 