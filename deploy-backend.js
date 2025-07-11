const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Backend Configuration
const CONFIG = {
  backend: {
    cpanelPath: '/apannerc/server',
    productionUrl: 'https://www.apanner.com',
    port: process.env.PORT || 3001
  },
  deployDir: './Deploy',
  getBuildDir: () => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `./Deploy/${date}`;
  },
  getBackendBuildDir: () => `${CONFIG.getBuildDir()}/server`
};

// Utility functions
function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠ Source directory does not exist: ${src}`);
    return;
  }
  
  createDirectory(dest);
  
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied: ${src} -> ${dest}`);
  } else {
    console.log(`⚠ File not found: ${src}`);
  }
}

function buildBackend() {
  console.log('\n🔨 Building Backend...');
  
  const backendBuildDir = CONFIG.getBackendBuildDir();
  createDirectory(backendBuildDir);
  
  // Copy server files
  copyDirectory('./server', backendBuildDir);
  
  // Create production package.json for backend
  const backendPackageJson = {
    name: 'spadescore-backend',
    version: '1.0.0',
    description: 'Spades Game Backend Server',
    main: 'server.js',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js'
    },
    dependencies: {
      express: '^4.18.2',
      cors: '^2.8.5'
    },
    engines: {
      node: '>=14.0.0'
    }
  };
  
  fs.writeFileSync(
    path.join(backendBuildDir, 'package.json'),
    JSON.stringify(backendPackageJson, null, 2)
  );
  console.log('✓ Created backend package.json');
  
  // Update server.js for production
  const serverPath = path.join(backendBuildDir, 'server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Update port configuration for cPanel
  serverContent = serverContent.replace(
    'const PORT = process.env.PORT || 3001;',
    `const PORT = process.env.PORT || ${CONFIG.backend.port};

// Production middleware for cPanel
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://www.apanner.com');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
}`
  );

  // Add missing /api base route - insert before the health check route
  const healthRouteIndex = serverContent.indexOf('app.get(\'/health\'');
  if (healthRouteIndex !== -1) {
    const beforeHealth = serverContent.substring(0, healthRouteIndex);
    const afterHealth = serverContent.substring(healthRouteIndex);
    
    serverContent = beforeHealth + `// API base route for frontend compatibility
app.get('/api', (req, res) => {
  const gameIds = getAllGameFiles();
  res.json({ 
    message: 'Spades Game API Server',
    status: 'running', 
    activeGames: gameIds.length,
    uptime: process.uptime(),
    endpoints: {
      health: '/health',
      api: '/api',
      createGame: '/api/create',
      joinGame: '/api/join',
      gameState: '/api/game/:gameId',
      gameAction: '/api/action',
      admin: '/api/admin/games',
      players: '/api/players',
      profiles: '/api/players/:name/profile'
    }
  });
});

// ` + afterHealth;
    console.log('✓ Added missing /api base route');
  } else {
    console.log('⚠️ Could not find health route to insert /api route');
  }

  // Add better error handling and logging
  serverContent = serverContent.replace(
    'app.listen(PORT, () => {',
    `// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server with better error handling
app.listen(PORT, () => {`
  );
  
  fs.writeFileSync(serverPath, serverContent);
  console.log('✓ Updated server.js for production');
  
  // Create necessary directories
  const dirs = ['games', 'players', 'player_profiles', 'game_history'];
  dirs.forEach(dir => {
    createDirectory(path.join(backendBuildDir, dir));
  });
  console.log('✓ Created backend data directories');
  
  // Create .htaccess file for cPanel
  const htaccessContent = `# Node.js app configuration
RewriteEngine On

# Handle all requests to Node.js app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ server.js [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options SAMEORIGIN
Header always set X-XSS-Protection "1; mode=block"

# CORS headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
`;
  
  fs.writeFileSync(path.join(backendBuildDir, '.htaccess'), htaccessContent);
  console.log('✓ Created .htaccess file');
  
  // Create startup script for debugging
  const startupScript = `#!/bin/bash
# cPanel Node.js startup script for Spades Game Backend

echo "🚀 Starting Spades Game Backend Server..."
echo "📍 Working directory: $(pwd)"
echo "📝 Node.js version: $(node --version)"
echo "📦 NPM version: $(npm --version)"
echo "🌍 Environment: $NODE_ENV"

# List files to verify upload
echo "📁 Files in directory:"
ls -la

# Check if directories exist
echo "📂 Checking data directories..."
for dir in games players player_profiles game_history; do
  if [ -d "$dir" ]; then
    echo "✓ $dir directory exists"
  else
    echo "⚠ $dir directory missing - creating..."
    mkdir -p "$dir"
  fi
done

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install --production
fi

# Start the server
echo "🟢 Starting server..."
NODE_ENV=production node server.js
`;
  
  fs.writeFileSync(path.join(backendBuildDir, 'startup.sh'), startupScript);
  console.log('✓ Created startup script');
}

function generateBackendInstructions() {
  console.log('\n📋 Generating Backend Deployment Instructions...');
  
  const backendBuildDir = CONFIG.getBackendBuildDir();
  const instructions = `
# Backend Deployment Instructions

## Files Generated
- Backend files: ${backendBuildDir}

## Step 1: Upload Backend Files to cPanel

### Method 1: Direct Upload
1. Zip the ${backendBuildDir} folder
2. Login to cPanel File Manager
3. Navigate to ${CONFIG.backend.cpanelPath} (create if doesn't exist)
4. Upload and extract the ZIP file
5. Verify all files are present:
   - server.js
   - package.json
   - .htaccess
   - startup.sh
   - games/ (directory)
   - players/ (directory)
   - player_profiles/ (directory)
   - game_history/ (directory)

## Step 2: Configure Node.js App in cPanel

### Via cPanel Node.js App Manager:
1. Log into cPanel
2. Go to "Node.js App" in Software section
3. Click "Create Application"
4. Configuration:
   - Node.js Version: 16.x or higher (NOT 18.x if having issues)
   - Application Mode: Production
   - Application Root: ${CONFIG.backend.cpanelPath}
   - Application URL: Leave empty or use "server" 
   - Application startup file: server.js
   - Environment variables:
     - NODE_ENV: production
     - PORT: (leave empty - cPanel will assign)

5. Click "Create"
6. In the app interface, click "Run NPM Install"
7. Wait for installation to complete
8. Click "Start" to run the application

### IMPORTANT: Check Application Status
- Make sure status shows "Running" 
- Check the application logs for any errors
- Note the assigned port number

## Step 2: Configure API Access

To make the backend accessible at ${CONFIG.backend.productionUrl}, add this to your main .htaccess:

\`\`\`apache
RewriteEngine On

# Proxy API requests to Node.js app
RewriteCond %{REQUEST_URI} ^/api/(.*)
RewriteRule ^api/(.*)$ http://localhost:[NODE_PORT]/$1 [P,L]

# Replace [NODE_PORT] with the actual port assigned by cPanel
\`\`\`

## Step 3: Test Backend

### Test URLs (replace with your actual domain):
1. **Health Check**: https://www.apanner.com/health
2. **API Root**: https://www.apanner.com/api  
3. **Server Root**: https://www.apanner.com/
4. **Game Creation**: https://www.apanner.com/api/create
5. **Admin Panel**: https://www.apanner.com/api/admin/games

### Expected Responses:
- \`/health\` should return: \`{"status":"ok","activeGames":0,"uptime":...}\`
- \`/api\` should return: \`{"message":"Spades Game API Server","status":"running",...}\`
- \`/\` should return: \`{"message":"Spades Game API Server","status":"running",...}\`

### If you get "Cannot GET /api" error:
1. Check if Node.js app is running in cPanel
2. Verify the application status is "Running"
3. Check application logs for errors
4. Restart the Node.js application

## Environment Variables:
- NODE_ENV: production
- PORT: (assigned by cPanel automatically)

## File Structure on cPanel:
\`\`\`
${CONFIG.backend.cpanelPath}/
├── server.js (main application file)
├── package.json (dependencies)
├── .htaccess (Apache configuration)
├── startup.sh (startup script)
├── games/ (game data directory)
├── players/ (player data directory)
├── player_profiles/ (player profiles)
└── game_history/ (game history)
\`\`\`

## Troubleshooting:

### 1. "Cannot GET /api" Error:
- **Cause**: Node.js app is not running
- **Fix**: Go to cPanel → Node.js Apps → Start your application

### 2. "404 Not Found" Error:
- **Cause**: Routes not configured properly
- **Fix**: Check if server.js was modified correctly during deployment

### 3. "Internal Server Error" (500):
- **Cause**: Server crash or dependency issues
- **Fix**: Check application logs, verify dependencies installed

### 4. App won't start:
- **Cause**: Missing dependencies or wrong Node.js version
- **Fix**: Run "NPM Install" in cPanel, try different Node.js version

### 5. Permission Issues:
- **Cause**: File permissions incorrect
- **Fix**: Set file permissions to 644 for files, 755 for directories

### Common cPanel Node.js Issues:
- Use Node.js 16.x instead of 18.x if having compatibility issues
- Make sure "Application Mode" is set to "Production"
- Verify the "Application Root" path is correct
- Check that the startup file is "server.js"
- Ensure environment variables are set correctly
`;

  fs.writeFileSync(path.join(CONFIG.getBuildDir(), 'BACKEND_DEPLOYMENT.md'), instructions);
  console.log('✓ Backend deployment instructions created');
}

function generateBackendUploadScripts() {
  console.log('\n📜 Generating Backend Upload Scripts...');
  
  const backendBuildDir = CONFIG.getBackendBuildDir();
  // Bash script for Linux/Mac
  const bashScript = `#!/bin/bash
# Backend Upload Script

echo "🚀 Uploading Backend to cPanel..."

# Configuration
CPANEL_USER="apannerc"
CPANEL_HOST="www.apanner.com"
BACKEND_LOCAL="${backendBuildDir}"
BACKEND_REMOTE="${CONFIG.backend.cpanelPath}"

# Upload backend files
echo "📤 Uploading backend files..."
scp -r "$BACKEND_LOCAL"/* "$CPANEL_USER@$CPANEL_HOST:$BACKEND_REMOTE/"

echo "✅ Backend upload completed!"
echo "🔧 Next steps:"
echo "   1. Set up Node.js app in cPanel"
echo "   2. Install dependencies with 'npm install'"
echo "   3. Start the Node.js application"
echo "   4. Test API endpoints"
`;

  fs.writeFileSync(path.join(CONFIG.getBuildDir(), 'upload-backend.sh'), bashScript);
  
  // Windows batch script
  const windowsScript = `@echo off
REM Backend Upload Script (Windows)

echo 🚀 Uploading Backend to cPanel...

REM Configuration
set CPANEL_USER=apannerc
set CPANEL_HOST=www.apanner.com
set BACKEND_LOCAL=${backendBuildDir}
set BACKEND_REMOTE=${CONFIG.backend.cpanelPath}

echo 📤 Use an FTP client or cPanel File Manager to upload:
echo    Backend: %BACKEND_LOCAL% → %BACKEND_REMOTE%

echo ✅ Manual upload required on Windows
echo 🔧 After upload:
echo    1. Set up Node.js app in cPanel
echo    2. Install dependencies with npm install
echo    3. Start the Node.js application
echo    4. Test API endpoints

pause
`;

  fs.writeFileSync(path.join(CONFIG.getBuildDir(), 'upload-backend.bat'), windowsScript);
  
  // Make bash script executable
  try {
    execSync('chmod +x ' + path.join(CONFIG.getBuildDir(), 'upload-backend.sh'));
  } catch (e) {
    // Ignore on Windows
  }
  
  console.log('✓ Backend upload scripts created');
}

// Check if build already exists and ask for confirmation
function checkOverwrite() {
  const buildDir = CONFIG.getBuildDir();
  const backendBuildDir = CONFIG.getBackendBuildDir();
  
  if (fs.existsSync(backendBuildDir)) {
    const date = path.basename(buildDir);
    console.log(`⚠️  Backend build already exists for ${date}`);
    console.log(`📁 Path: ${backendBuildDir}`);
    
    // In a real interactive environment, you'd use a proper prompt library
    // For now, we'll just show the warning and proceed
    console.log('🔄 Overwriting existing build...\n');
    fs.rmSync(backendBuildDir, { recursive: true, force: true });
  }
}

// Main backend deployment function
function deployBackend() {
  console.log('🚀 Starting Backend Deployment Process...');
  console.log('================================\n');
  
  try {
    const buildDir = CONFIG.getBuildDir();
    const backendBuildDir = CONFIG.getBackendBuildDir();
    
    // Check for existing build
    checkOverwrite();
    
    // Create deploy directory
    createDirectory(CONFIG.deployDir);
    createDirectory(buildDir);
    
    // Build backend
    buildBackend();
    
    // Create deployment assets
    generateBackendInstructions();
    generateBackendUploadScripts();
    
    console.log('\n✅ Backend deployment package created successfully!');
    console.log('================================');
    console.log(`📁 Backend build directory: ${backendBuildDir}`);
    console.log(`📖 Instructions: ${buildDir}/BACKEND_DEPLOYMENT.md`);
    console.log(`🐧 Linux/Mac upload: ${buildDir}/upload-backend.sh`);
    console.log(`🪟 Windows upload: ${buildDir}/upload-backend.bat`);
    console.log('\n📋 Next steps:');
    console.log('1. Read the backend deployment instructions');
    console.log('2. Upload backend files to cPanel');
    console.log('3. Configure Node.js application');
    console.log('4. Test the API endpoints');
    console.log(`\n🎯 Production API URL: ${CONFIG.backend.productionUrl}`);
    
  } catch (error) {
    console.error('❌ Backend deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployBackend();
}

module.exports = { deployBackend, CONFIG }; 