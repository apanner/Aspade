#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}=== Railway Deployment Script ===${NC}\n"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check if user is logged in
echo -e "${YELLOW}Checking Railway login status...${NC}"
if ! railway whoami &> /dev/null; then
    echo -e "${RED}Not logged in to Railway. Please login:${NC}"
    railway login
fi

# Setup project
echo -e "\n${CYAN}Setting up project Aspade...${NC}"
railway project

# Deploy backend
echo -e "\n${CYAN}Deploying Backend (serv)...${NC}"
cd serv
railway link
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway up --service backend
BACKEND_STATUS=$?
cd ..

# Get backend URL for frontend environment
BACKEND_URL=$(railway status --service backend | grep -o 'https://[^ ]*' || echo "")
echo -e "${YELLOW}Backend URL: ${BACKEND_URL}${NC}"

# Deploy frontend (root directory)
echo -e "\n${CYAN}Deploying Frontend (root)...${NC}"
railway link
railway variables set NODE_ENV=production
railway variables set PORT=3000
if [ -n "$BACKEND_URL" ]; then
    railway variables set NEXT_PUBLIC_API_URL="$BACKEND_URL"
fi
railway up --service frontend
FRONTEND_STATUS=$?

# Summary
echo -e "\n${CYAN}=== Deployment Summary ===${NC}"
if [ $BACKEND_STATUS -eq 0 ]; then
    echo -e "Backend: ${GREEN}✓ Success${NC}"
else
    echo -e "Backend: ${RED}✗ Failed${NC}"
fi

if [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "Frontend: ${GREEN}✓ Success${NC}"
else
    echo -e "Frontend: ${RED}✗ Failed${NC}"
fi

if [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "\n${GREEN}All services deployed successfully!${NC}"
    echo -e "\n${YELLOW}Visit the Railway dashboard for more details: https://railway.app/dashboard${NC}"
else
    echo -e "\n${RED}Some services failed to deploy. Check the logs above for details.${NC}"
fi 