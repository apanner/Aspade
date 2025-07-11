#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import separate deployment scripts
const { deployBackend } = require('./deploy-backend');
const { deployFrontend } = require('./deploy-frontend');

// Configuration
const CONFIG = {
  // cPanel paths
  backend: {
    cpanelPath: '/apannerc/server',
    productionUrl: 'https://www.apanner.com'
  },
  frontend: {
    cpanelPath: '/apannerc/game',
    productionUrl: 'https://www.apanner.com/game/',
    basePath: '/game'
  },
  // Build directories
  deployDir: './Deploy',
  getBuildDir: () => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `./Deploy/${date}`;
  },
  getBackendBuildDir: () => `${CONFIG.getBuildDir()}/server`,
  getFrontendBuildDir: () => `${CONFIG.getBuildDir()}/frontend`
};

// Utility functions
function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

function generateCombinedInstructions() {
  console.log('\n📋 Generating Combined Deployment Instructions...');
  
  const buildDir = CONFIG.getBuildDir();
  const backendBuildDir = CONFIG.getBackendBuildDir();
  const frontendBuildDir = CONFIG.getFrontendBuildDir();
  
  const instructions = `
# Complete Spades Game Deployment to cPanel

This guide covers deploying both the backend (Node.js) and frontend (Next.js) to cPanel hosting.

## Overview

- **Backend**: Node.js server deployed to \`${CONFIG.backend.cpanelPath}\`
- **Frontend**: Static Next.js app deployed to \`${CONFIG.frontend.cpanelPath}\`
- **Backend URL**: ${CONFIG.backend.productionUrl}
- **Frontend URL**: ${CONFIG.frontend.productionUrl}

## Files Generated

- Backend files: \`${backendBuildDir}\`
- Frontend files: \`${frontendBuildDir}\`
- Backend instructions: \`BACKEND_DEPLOYMENT.md\`
- Frontend instructions: \`FRONTEND_DEPLOYMENT.md\`

## Quick Start

### 1. Deploy Backend First

Run the backend upload script:
- **Linux/Mac**: \`./upload-backend.sh\`
- **Windows**: \`upload-backend.bat\`

Or upload manually:
1. Upload all files from \`${backendBuildDir}\` to \`${CONFIG.backend.cpanelPath}\`
2. Set up Node.js application in cPanel
3. Install dependencies and start the app

### 2. Deploy Frontend

Run the frontend upload script:
- **Linux/Mac**: \`./upload-frontend.sh\`
- **Windows**: \`upload-frontend.bat\`

Or upload manually:
1. Upload all files from \`${frontendBuildDir}\` to \`${CONFIG.frontend.cpanelPath}\`
2. Verify the .htaccess file is properly configured

### 3. Test the Deployment

1. **Backend Health Check**: ${CONFIG.backend.productionUrl}/health
2. **Frontend**: ${CONFIG.frontend.productionUrl}
3. **Full Game Test**: Create and join a game

## Deployment Scripts

### Separate Deployment
You can deploy backend and frontend separately:

\`\`\`bash
# Deploy only backend
node deploy-backend.js

# Deploy only frontend
node deploy-frontend.js

# Deploy both (this script)
node deploy.js
\`\`\`

### NPM Scripts
Add these to your package.json:

\`\`\`json
{
  "scripts": {
    "deploy": "node deploy.js",
    "deploy:backend": "node deploy-backend.js",
    "deploy:frontend": "node deploy-frontend.js"
  }
}
\`\`\`

## Environment Variables

### Backend
- \`NODE_ENV=production\`
- \`PORT\` (assigned by cPanel)

### Frontend
- \`NEXT_PUBLIC_API_URL=${CONFIG.backend.productionUrl}\`

## File Structure on cPanel

\`\`\`
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
\`\`\`

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
- \`BACKEND_DEPLOYMENT.md\` for backend-specific details
- \`FRONTEND_DEPLOYMENT.md\` for frontend-specific details
`;

  fs.writeFileSync(path.join(buildDir, 'COMPLETE_DEPLOYMENT.md'), instructions);
  console.log('✓ Combined deployment instructions created');
}

// Functions are now handled by separate deploy scripts

// Check if build already exists and ask for confirmation
function checkOverwrite() {
  const buildDir = CONFIG.getBuildDir();
  
  if (fs.existsSync(buildDir)) {
    const date = path.basename(buildDir);
    console.log(`⚠️  Build already exists for ${date}`);
    console.log(`📁 Path: ${buildDir}`);
    
    // In a real interactive environment, you'd use a proper prompt library
    // For now, we'll just show the warning and proceed
    console.log('🔄 Overwriting existing build...\n');
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
}

// Main deployment function that calls both backend and frontend deployments
function deploy() {
  console.log('🚀 Starting Complete cPanel Deployment Process...');
  console.log('================================\n');
  
  try {
    const buildDir = CONFIG.getBuildDir();
    
    // Check for existing build
    checkOverwrite();
    
    // Create deploy directory
    createDirectory(CONFIG.deployDir);
    createDirectory(buildDir);
    
    console.log('📦 Deploying Backend...');
    deployBackend();
    
    console.log('\n📦 Deploying Frontend...');
    deployFrontend();
    
    // Create combined deployment instructions
    generateCombinedInstructions();
    
    console.log('\n✅ Complete deployment package created successfully!');
    console.log('================================');
    console.log(`📁 Build directory: ${buildDir}`);
    console.log(`📖 Combined instructions: ${buildDir}/COMPLETE_DEPLOYMENT.md`);
    console.log(`📖 Backend instructions: ${buildDir}/BACKEND_DEPLOYMENT.md`);
    console.log(`📖 Frontend instructions: ${buildDir}/FRONTEND_DEPLOYMENT.md`);
    console.log('\n📋 Upload scripts:');
    console.log(`🐧 Backend (Linux/Mac): ${buildDir}/upload-backend.sh`);
    console.log(`🐧 Frontend (Linux/Mac): ${buildDir}/upload-frontend.sh`);
    console.log(`🪟 Backend (Windows): ${buildDir}/upload-backend.bat`);
    console.log(`🪟 Frontend (Windows): ${buildDir}/upload-frontend.bat`);
    console.log('\n🎯 Production URLs:');
    console.log(`   Game: ${CONFIG.frontend.productionUrl}`);
    console.log(`   API: ${CONFIG.backend.productionUrl}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deploy();
}

module.exports = { deploy, CONFIG }; 