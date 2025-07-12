#!/bin/bash

# Deploy A-Spade Backend to Fly.io
echo "🚀 Deploying A-Spade Backend to Fly.io..."

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

# Navigate to server directory
cd server

# Check if app exists, create if not
if ! flyctl apps list | grep -q "aspade-backend"; then
    echo -e "${YELLOW}🆕 Creating new backend app...${NC}"
    flyctl apps create aspade-backend
    
    # Create volume for persistent data
    echo -e "${YELLOW}💾 Creating volume for data persistence...${NC}"
    flyctl volumes create aspade_data --region iad --size 1
else
    echo -e "${GREEN}📱 Backend app already exists${NC}"
fi

# Deploy backend
echo -e "${GREEN}🚀 Deploying backend application...${NC}"
flyctl deploy

# Get backend URL
BACKEND_URL=$(flyctl info --json | jq -r '.Hostname')
echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo -e "${GREEN}🌐 Backend URL: https://${BACKEND_URL}${NC}"
echo -e "${GREEN}🔍 Health check: https://${BACKEND_URL}/health${NC}"

echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Test the backend: curl https://${BACKEND_URL}/health"
echo "2. Deploy the frontend with: ./deploy-frontend.sh"
echo "3. Monitor logs: flyctl logs -a aspade-backend" 