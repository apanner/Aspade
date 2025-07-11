const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Frontend Configuration
const CONFIG = {
  frontend: {
    cpanelPath: '/apannerc/game',
    productionUrl: 'https://www.apanner.com/game/',
    basePath: '/game'
  },
  backend: {
    productionUrl: 'https://www.apanner.com'
  },
  deployDir: './Deploy',
  getBuildDir: () => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `./Deploy/${date}`;
  },
  getFrontendBuildDir: () => `${CONFIG.getBuildDir()}/frontend`
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
  if (!fs.existsSync(src)) {
    console.log(`⚠ Source file does not exist: ${src}`);
    return;
  }
  
  // Create destination directory if it doesn't exist
  const destDir = path.dirname(dest);
  createDirectory(destDir);
  
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied file: ${src} → ${dest}`);
}

function buildFrontend() {
  console.log('\n🔨 Building Frontend...');
  
  // Temporarily move problematic directories outside the project
  const tempDirs = ['ref', 'spadescore_old'];
  const tempMovedDirs = [];
  const tempLocation = path.join('..', 'temp_deploy_backup');
  
  // Create temp directory outside project
  if (!fs.existsSync(tempLocation)) {
    fs.mkdirSync(tempLocation, { recursive: true });
  }
  
  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const dirName = path.basename(dir);
      const tempName = path.join(tempLocation, `${dirName}_${Date.now()}`);
      fs.renameSync(dir, tempName);
      tempMovedDirs.push({ original: dir, temp: tempName });
      console.log(`✓ Temporarily moved ${dir} to ${tempName}`);
    }
  });
  
  // Temporarily move API directory specifically
  const apiDir = path.join('app', 'api');
  if (fs.existsSync(apiDir)) {
    const tempApiName = path.join(tempLocation, `api_${Date.now()}`);
    fs.renameSync(apiDir, tempApiName);
    tempMovedDirs.push({ original: apiDir, temp: tempApiName });
    console.log(`✓ Temporarily moved ${apiDir} to ${tempApiName}`);
  }
  
  // Update Next.js config for static export
  const nextConfigContent = `
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '${CONFIG.frontend.basePath}',
  assetPrefix: '${CONFIG.frontend.basePath}',
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://www.apanner.com',
    NEXT_PUBLIC_BASE_PATH: '${CONFIG.frontend.basePath}',
  },
  trailingSlash: true,
};

export default nextConfig;
`;
  
  fs.writeFileSync('next.config.ts', nextConfigContent);
  console.log('✓ Updated next.config.ts for static export');
  
  // Set environment variables for build
  process.env.NEXT_PUBLIC_API_URL = CONFIG.backend.productionUrl;
  process.env.NODE_ENV = 'production';
  
  // Create .env.production file to ensure variables are embedded
  const envContent = `NEXT_PUBLIC_API_URL=${CONFIG.backend.productionUrl}
NEXT_PUBLIC_BASE_PATH=${CONFIG.frontend.basePath}
NODE_ENV=production
`;
  fs.writeFileSync('.env.production', envContent);
  console.log('✓ Created .env.production file');
  
  // Also create .env.local as backup
  fs.writeFileSync('.env.local', envContent);
  console.log('✓ Created .env.local file');
  
  // Create session management patch for basePath compatibility
  const sessionPatchContent = `
// Session Management Patch for basePath compatibility
// This file patches the frontend to handle session management with basePath

(function() {
  console.log('🔧 Loading session management patch...');
  
  // Enhanced localStorage wrapper that handles basePath
  const sessionStoragePatched = {
    savePlayerSession: function(gameId, playerId, playerName) {
      const session = {
        gameId,
        playerId, 
        playerName,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem('spadeSync_session', JSON.stringify(session));
        // Also save to URL params as backup
        if (window.history && window.history.replaceState) {
          const url = new URL(window.location);
          url.searchParams.set('sid', btoa(JSON.stringify({gameId, playerId, playerName})));
          window.history.replaceState({}, '', url);
        }
        console.log('✅ Session saved:', session);
      } catch (e) {
        console.warn('⚠️ localStorage not available, session saved to URL only');
      }
    },
    
    savePlayerName: function(playerName) {
      const existingSession = this.getPlayerSession();
      const session = {
        gameId: existingSession?.gameId || '',
        playerId: existingSession?.playerId || '',
        playerName,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem('spadeSync_session', JSON.stringify(session));
        console.log('✅ Player name saved:', playerName);
      } catch (e) {
        console.warn('⚠️ localStorage not available for player name');
      }
    },
    
    getPlayerSession: function() {
      try {
        // Try localStorage first
        const session = localStorage.getItem('spadeSync_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
            console.log('✅ Session found in localStorage:', parsed);
            return parsed;
          }
        }
      } catch (e) {
        console.warn('⚠️ localStorage not accessible');
      }
      
      // Fallback to URL params
      try {
        const url = new URL(window.location);
        const sessionData = url.searchParams.get('sid');
        if (sessionData) {
          const decoded = JSON.parse(atob(sessionData));
          console.log('✅ Session found in URL:', decoded);
          return decoded;
        }
      } catch (e) {
        console.warn('⚠️ URL session not available');
      }
      
      console.log('❌ No session found');
      return null;
    },
    
    clearPlayerSession: function() {
      try {
        localStorage.removeItem('spadeSync_session');
      } catch (e) {}
      
      try {
        const url = new URL(window.location);
        url.searchParams.delete('sid');
        window.history.replaceState({}, '', url);
      } catch (e) {}
      console.log('✅ Session cleared');
    }
  };
  
  // Override window.sessionStorage to use our patched version
  if (typeof window !== 'undefined') {
    window.sessionStoragePatched = sessionStoragePatched;
    
    // Also patch any existing sessionStorage references
    if (window.sessionStorage) {
      Object.keys(sessionStoragePatched).forEach(key => {
        window.sessionStorage[key] = sessionStoragePatched[key];
      });
    }
  }
  
  // Override global sessionStorage if it exists
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStoragePatched).forEach(key => {
      sessionStorage[key] = sessionStoragePatched[key];
    });
  }
  
  console.log('🔧 Session management patch loaded and applied');
})();
`;
  
  fs.writeFileSync('session-patch.js', sessionPatchContent);
  console.log('✓ Created session management patch');
  
  try {
    // Build the Next.js app
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✓ Frontend build completed');
    
    // Copy built files from static export
    const frontendBuildDir = CONFIG.getFrontendBuildDir();
    createDirectory(frontendBuildDir);
    
    // Copy static export output from out/ folder
    if (fs.existsSync('./out')) {
      copyDirectory('./out', frontendBuildDir);
      console.log('✓ Static export files copied to build directory');
      
      // Copy session patch to frontend build
      if (fs.existsSync('session-patch.js')) {
        copyFile('session-patch.js', path.join(frontendBuildDir, 'session-patch.js'));
        console.log('✓ Session patch copied to frontend');
        
        // Inject session patch into HTML files
        const htmlFiles = [
          path.join(frontendBuildDir, 'index.html'),
          path.join(frontendBuildDir, 'games', 'demo', 'index.html'),
          path.join(frontendBuildDir, 'games', 'example', 'index.html'),
          path.join(frontendBuildDir, 'game', 'demo', 'index.html'),
          path.join(frontendBuildDir, 'game', 'example', 'index.html'),
        ];
        
        htmlFiles.forEach(htmlFile => {
          if (fs.existsSync(htmlFile)) {
            let content = fs.readFileSync(htmlFile, 'utf8');
            
            // Inject session patch script before closing head tag
            const basePath = CONFIG.frontend.basePath;
            const sessionPatchScript = `<script src="${basePath}/session-patch.js"></script>`;
            content = content.replace('</head>', `${sessionPatchScript}</head>`);
            
            fs.writeFileSync(htmlFile, content);
            console.log(`✓ Session patch injected into ${path.basename(htmlFile)}`);
          }
        });
      }
    } else {
      throw new Error('Static export failed - out/ folder not found');
    }
    
  } catch (error) {
    console.error('❌ Frontend build failed:', error.message);
    throw error;
  } finally {
    // Restore moved directories
    tempMovedDirs.forEach(({ original, temp }) => {
      if (fs.existsSync(temp)) {
        fs.renameSync(temp, original);
        console.log(`✓ Restored ${path.basename(temp)} to ${original}`);
      }
    });
    
    // Clean up environment files
    ['.env.production', '.env.local', 'session-patch.js'].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✓ Cleaned up ${file}`);
      }
    });
    
    // Clean up temp directory if empty
    try {
      if (fs.existsSync(tempLocation)) {
        const tempFiles = fs.readdirSync(tempLocation);
        if (tempFiles.length === 0) {
          fs.rmdirSync(tempLocation);
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

function createHtaccessFiles() {
  console.log('\n🔧 Creating .htaccess files...');
  
  const frontendBuildDir = CONFIG.getFrontendBuildDir();
  // Frontend .htaccess
  const frontendHtaccess = `RewriteEngine On
RewriteBase ${CONFIG.frontend.basePath}/

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . ${CONFIG.frontend.basePath}/index.html [L]

# Cache static assets
<FilesMatch "\\.(js|css|png|jpg|jpeg|gif|svg|ico)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
</FilesMatch>

# Security headers
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
</IfModule>
`;

  fs.writeFileSync(path.join(frontendBuildDir, '.htaccess'), frontendHtaccess);
  console.log('✓ Frontend .htaccess created');
  
  // Create a test page for debugging API communication
  const testPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        button { margin: 5px; padding: 10px 15px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔍 Frontend-Backend Communication Test</h1>
    <p><strong>Backend URL:</strong> <span id="api-url">${CONFIG.backend.productionUrl}</span></p>
    
    <div>
        <button onclick="testEndpoint('/health')">Test Health</button>
        <button onclick="testEndpoint('/api')">Test API Root</button>
        <button onclick="testEndpoint('/api/admin/games')">Test Admin Games</button>
        <button onclick="testEndpoint('/api/admin/players')">Test Admin Players</button>
        <button onclick="testApiCreate()">Test Create Game</button>
        <button onclick="clearResults()">Clear Results</button>
    </div>
    
    <div id="results"></div>
    
    <script>
        const API_BASE_URL = '${CONFIG.backend.productionUrl}';
        
        function addResult(type, title, content) {
            const results = document.getElementById('results');
            const div = document.createElement('div');
            div.className = 'test-result ' + type;
            div.innerHTML = '<h3>' + title + '</h3><pre>' + content + '</pre>';
            results.appendChild(div);
        }
        
        function clearResults() {
            document.getElementById('results').innerHTML = '';
        }
        
        async function testEndpoint(endpoint) {
            const url = API_BASE_URL + endpoint;
            addResult('info', 'Testing: ' + endpoint, 'Request: GET ' + url);
            
            try {
                const response = await fetch(url);
                const text = await response.text();
                
                if (response.ok) {
                    let data;
                    try {
                        data = JSON.parse(text);
                        addResult('success', '✅ Success: ' + endpoint, 
                            'Status: ' + response.status + '\\n' + 
                            'Response: ' + JSON.stringify(data, null, 2));
                    } catch (e) {
                        addResult('success', '✅ Success: ' + endpoint, 
                            'Status: ' + response.status + '\\n' + 
                            'Response: ' + text);
                    }
                } else {
                    addResult('error', '❌ Failed: ' + endpoint, 
                        'Status: ' + response.status + '\\n' + 
                        'Response: ' + text);
                }
            } catch (error) {
                addResult('error', '❌ Error: ' + endpoint, error.message);
            }
        }
        
        async function testApiCreate() {
            const url = API_BASE_URL + '/api/create';
            const gameData = {
                hostName: 'TestPlayer',
                title: 'Test Game',
                gameMode: 'teams',
                maxPlayers: 4,
                totalRounds: 13
            };
            
            addResult('info', 'Testing: Create Game', 'Request: POST ' + url + '\\nData: ' + JSON.stringify(gameData, null, 2));
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gameData)
                });
                
                const text = await response.text();
                
                if (response.ok) {
                    let data;
                    try {
                        data = JSON.parse(text);
                        addResult('success', '✅ Game Created Successfully!', 
                            'Status: ' + response.status + '\\n' + 
                            'Game ID: ' + data.gameId + '\\n' +
                            'Game Code: ' + data.code + '\\n' +
                            'Response: ' + JSON.stringify(data, null, 2));
                    } catch (e) {
                        addResult('success', '✅ Create Game Success', 
                            'Status: ' + response.status + '\\n' + 
                            'Response: ' + text);
                    }
                } else {
                    addResult('error', '❌ Failed to Create Game', 
                        'Status: ' + response.status + '\\n' + 
                        'Response: ' + text);
                }
            } catch (error) {
                addResult('error', '❌ Error Creating Game', error.message);
            }
        }
        
        // Auto-test on page load
        window.onload = function() {
            addResult('info', '🚀 Starting Auto-Tests', 'Testing basic endpoints...');
            setTimeout(() => testEndpoint('/health'), 500);
            setTimeout(() => testEndpoint('/api'), 1000);
            setTimeout(() => testEndpoint('/api/admin/games'), 1500);
        };
    </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(frontendBuildDir, 'api-test.html'), testPageContent);
  console.log('✓ Created API test page: api-test.html');
}

function generateFrontendInstructions() {
  console.log('\n📋 Generating Frontend Deployment Instructions...');
  
  const frontendBuildDir = CONFIG.getFrontendBuildDir();
  const instructions = `
# Frontend Deployment Instructions

## Files Generated
- Frontend files: ${frontendBuildDir}

## Step 1: Deploy Static Frontend to cPanel

### Upload Static Files:
1. Upload all files from ${frontendBuildDir} to ${CONFIG.frontend.cpanelPath}
2. This is a **static HTML export** - no Node.js required
3. Files can be uploaded via:
   - cPanel File Manager
   - FTP/SFTP client
   - Upload scripts provided

### Configure Web Server:
The .htaccess file has been automatically created with the following features:
- Client-side routing support (SPA routing)
- Static asset caching
- Security headers
- Proper MIME types

### Manual .htaccess Configuration (if needed):
If you need to manually create/update .htaccess in ${CONFIG.frontend.cpanelPath}:
\`\`\`apache
RewriteEngine On
RewriteBase ${CONFIG.frontend.basePath}/

# Handle client-side routing for SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . ${CONFIG.frontend.basePath}/index.html [L]

# Cache static assets
<FilesMatch "\\.(js|css|png|jpg|jpeg|gif|svg|ico)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
</FilesMatch>

# Security headers
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
</IfModule>
\`\`\`

## Step 2: Test Static Frontend

### Basic Testing:
1. Visit: ${CONFIG.frontend.productionUrl}
2. Test navigation between pages
3. Verify static assets load correctly

### API Communication Testing:
1. **Test Page**: Visit ${CONFIG.frontend.productionUrl}api-test.html
   - This page will automatically test backend communication
   - Shows detailed results for each endpoint
   - Helps diagnose frontend-backend connectivity issues

2. **Manual Testing**:
   - Try creating a game: ${CONFIG.frontend.productionUrl}create-game/
   - Try joining a game: ${CONFIG.frontend.productionUrl}join-game/
   - Check browser console for errors

### Expected API Test Results:
- ✅ **Health Check** (/health): Should return server status
- ✅ **API Root** (/api): Should return API endpoints list  
- ✅ **Admin Games** (/api/admin/games): Should return games array
- ✅ **Admin Players** (/api/admin/players): Should return players array
- ✅ **Create Game**: Should successfully create a test game

## File Structure on cPanel:
\`\`\`
${CONFIG.frontend.cpanelPath}/
├── index.html          # Main HTML file
├── .htaccess           # Apache configuration
├── _next/
│   ├── static/         # Static assets (CSS, JS, images)
│   └── [chunks]/       # JavaScript chunks
├── game/
│   └── [gameId]/       # Pre-built game pages
└── [other pages]/      # Other static HTML pages
\`\`\`

## Deployment Type: Static HTML Export
- **No Node.js required** - Pure HTML/CSS/JS
- **No server-side rendering** - All pages pre-built
- **Client-side routing** - Handled by .htaccess
- **API calls** - Made to separate backend server

## Environment Variables (Built-in):
- NEXT_PUBLIC_API_URL: ${CONFIG.backend.productionUrl}

## Troubleshooting:
- **404 errors**: Check .htaccess file exists and is configured correctly
- **API connection errors**: Verify backend is running at ${CONFIG.backend.productionUrl}
- **Asset loading issues**: Check basePath configuration
- **Routing issues**: Ensure .htaccess RewriteBase matches deployment path
- **CORS issues**: Verify backend allows requests from frontend domain

## Notes:
- This is a **static export build** - all pages are pre-rendered HTML
- No server-side processing - everything runs in the browser
- All API calls are made to the separate Node.js backend server
- Perfect for cPanel shared hosting (no Node.js hosting required)
`;

  fs.writeFileSync(path.join(CONFIG.getBuildDir(), 'FRONTEND_DEPLOYMENT.md'), instructions);
  console.log('✓ Frontend deployment instructions created');
}

function generateFrontendUploadScripts() {
  console.log('\n📜 Generating Frontend Upload Scripts...');
  
  const frontendBuildDir = CONFIG.getFrontendBuildDir();
  // Bash script for Linux/Mac
  const bashScript = `#!/bin/bash
# Frontend Upload Script

echo "🚀 Uploading Frontend to cPanel..."

# Configuration
CPANEL_USER="apannerc"
CPANEL_HOST="www.apanner.com"
FRONTEND_LOCAL="${frontendBuildDir}"
FRONTEND_REMOTE="${CONFIG.frontend.cpanelPath}"

# Upload frontend files
echo "📤 Uploading frontend files..."
scp -r "$FRONTEND_LOCAL"/* "$CPANEL_USER@$CPANEL_HOST:$FRONTEND_REMOTE/"

echo "✅ Frontend upload completed!"
echo "🔧 Next steps:"
echo "   1. Test the frontend at ${CONFIG.frontend.productionUrl}"
echo "   2. Verify API connection to backend"
echo "   3. Test game functionality"
`;

  fs.writeFileSync(path.join(CONFIG.getBuildDir(), 'upload-frontend.sh'), bashScript);
  
  // Windows batch script
  const windowsScript = `@echo off
REM Frontend Upload Script (Windows)

echo 🚀 Uploading Frontend to cPanel...

REM Configuration
set CPANEL_USER=apannerc
set CPANEL_HOST=www.apanner.com
set FRONTEND_LOCAL=${frontendBuildDir}
set FRONTEND_REMOTE=${CONFIG.frontend.cpanelPath}

echo 📤 Use an FTP client or cPanel File Manager to upload:
echo    Frontend: %FRONTEND_LOCAL% → %FRONTEND_REMOTE%

echo ✅ Manual upload required on Windows
echo 🔧 After upload:
echo    1. Test the frontend at ${CONFIG.frontend.productionUrl}
echo    2. Verify API connection to backend
echo    3. Test game functionality

pause
`;

  fs.writeFileSync(path.join(CONFIG.getBuildDir(), 'upload-frontend.bat'), windowsScript);
  
  // Make bash script executable
  try {
    execSync('chmod +x ' + path.join(CONFIG.getBuildDir(), 'upload-frontend.sh'));
  } catch (e) {
    // Ignore on Windows
  }
  
  console.log('✓ Frontend upload scripts created');
}

// Check if build already exists and ask for confirmation
function checkOverwrite() {
  const buildDir = CONFIG.getBuildDir();
  const frontendBuildDir = CONFIG.getFrontendBuildDir();
  
  if (fs.existsSync(frontendBuildDir)) {
    const date = path.basename(buildDir);
    console.log(`⚠️  Frontend build already exists for ${date}`);
    console.log(`📁 Path: ${frontendBuildDir}`);
    
    // In a real interactive environment, you'd use a proper prompt library
    // For now, we'll just show the warning and proceed
    console.log('🔄 Overwriting existing build...\n');
    fs.rmSync(frontendBuildDir, { recursive: true, force: true });
  }
}

// Main frontend deployment function
function deployFrontend() {
  console.log('🚀 Starting Frontend Deployment Process...');
  console.log('================================\n');
  
  try {
    const buildDir = CONFIG.getBuildDir();
    const frontendBuildDir = CONFIG.getFrontendBuildDir();
    
    // Check for existing build
    checkOverwrite();
    
    // Create deploy directory
    createDirectory(CONFIG.deployDir);
    createDirectory(buildDir);
    
    // Build frontend
    buildFrontend();
    
    // Create deployment assets
    createHtaccessFiles();
    generateFrontendInstructions();
    generateFrontendUploadScripts();
    
    console.log('\n✅ Frontend deployment package created successfully!');
    console.log('================================');
    console.log(`📁 Frontend build directory: ${frontendBuildDir}`);
    console.log(`📖 Instructions: ${buildDir}/FRONTEND_DEPLOYMENT.md`);
    console.log(`🐧 Linux/Mac upload: ${buildDir}/upload-frontend.sh`);
    console.log(`🪟 Windows upload: ${buildDir}/upload-frontend.bat`);
    console.log('\n📋 Next steps:');
    console.log('1. Read the frontend deployment instructions');
    console.log('2. Upload frontend files to cPanel');
    console.log('3. Test the frontend');
    console.log('4. Verify API connection to backend');
    console.log(`\n🎯 Production URL: ${CONFIG.frontend.productionUrl}`);
    
  } catch (error) {
    console.error('❌ Frontend deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployFrontend();
}

module.exports = { deployFrontend, CONFIG }; 