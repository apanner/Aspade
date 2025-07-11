const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  frontend: {
    buildDir: './Deploy/2025-07-11/frontend-nodejs',
    productionUrl: 'https://www.apanner.com',
    port: 3000
  },
  backend: {
    productionUrl: 'https://www.apanner.com'
  }
};

// Utility functions
function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied file: ${path.basename(srcPath)}`);
    }
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied file: ${path.basename(src)} → ${dest}`);
}

function buildNextJSApp() {
  console.log('\n🔨 Building Next.js Application...');
  
  // Create production next.config.ts for Node.js build
  const nextConfigContent = `
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export - we want a normal Next.js build
  // output: 'export', // REMOVED
  basePath: '/game',
  assetPrefix: '/game',
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://www.apanner.com',
    NEXT_PUBLIC_BASE_PATH: '/game',
  },
  trailingSlash: true,
  // Enable standalone build for easier deployment
  output: 'standalone',
};

export default nextConfig;
`;
  
  // Backup original config
  if (fs.existsSync('next.config.ts')) {
    fs.copyFileSync('next.config.ts', 'next.config.ts.backup');
    console.log('✓ Backed up original next.config.ts');
  }
  
  // Write production config
  fs.writeFileSync('next.config.ts', nextConfigContent);
  console.log('✓ Updated next.config.ts for Node.js build');
  
  // Create .env.production file
  const envContent = `NEXT_PUBLIC_API_URL=${CONFIG.backend.productionUrl}
NEXT_PUBLIC_BASE_PATH=/game
NODE_ENV=production
PORT=${CONFIG.frontend.port}
`;
  fs.writeFileSync('.env.production', envContent);
  console.log('✓ Created .env.production file');
  
  try {
    // Build the Next.js app
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✓ Next.js build completed');
    
    // Copy built files
    const buildDir = CONFIG.frontend.buildDir;
    createDirectory(buildDir);
    
    // Copy standalone build
    if (fs.existsSync('.next/standalone')) {
      copyDirectory('.next/standalone', buildDir);
      console.log('✓ Copied standalone build');
    }
    
    // Copy static files
    if (fs.existsSync('.next/static')) {
      const staticDir = path.join(buildDir, '.next/static');
      copyDirectory('.next/static', staticDir);
      console.log('✓ Copied static files');
    }
    
    // Copy public files
    if (fs.existsSync('public')) {
      const publicDir = path.join(buildDir, 'public');
      copyDirectory('public', publicDir);
      console.log('✓ Copied public files');
    }
    
  } catch (error) {
    console.error('❌ Next.js build failed:', error.message);
    throw error;
  } finally {
    // Restore original config
    if (fs.existsSync('next.config.ts.backup')) {
      fs.renameSync('next.config.ts.backup', 'next.config.ts');
      console.log('✓ Restored original next.config.ts');
    }
    
    // Clean up environment file
    if (fs.existsSync('.env.production')) {
      fs.unlinkSync('.env.production');
      console.log('✓ Cleaned up .env.production');
    }
  }
}

function createStartupFiles() {
  console.log('\n🔧 Creating startup files...');
  
  const buildDir = CONFIG.frontend.buildDir;
  
  // Create package.json for production
  const packageJson = {
    name: "spade-frontend",
    version: "1.0.0",
    scripts: {
      start: "node server.js"
    },
    dependencies: {
      "next": "15.2.4",
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    }
  };
  
  fs.writeFileSync(path.join(buildDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('✓ Created package.json');
  
  // Create startup script
  const startupScript = `#!/bin/bash
# Startup script for Next.js application

# Set environment
export NODE_ENV=production
export PORT=${CONFIG.frontend.port}

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
  npm install --production
fi

# Start the application
echo "Starting Next.js application on port ${CONFIG.frontend.port}..."
node server.js
`;
  
  fs.writeFileSync(path.join(buildDir, 'startup.sh'), startupScript);
  console.log('✓ Created startup script');
  
  // Create .htaccess for URL rewriting
  const htaccessContent = `RewriteEngine On
RewriteBase /game/

# Proxy all requests to Node.js app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:${CONFIG.frontend.port}/game/$1 [P,L]

# Handle direct access to static files
RewriteCond %{REQUEST_URI} ^/game/_next/static/
RewriteRule ^(.*)$ http://localhost:${CONFIG.frontend.port}/$1 [P,L]

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>
`;
  
  fs.writeFileSync(path.join(buildDir, '.htaccess'), htaccessContent);
  console.log('✓ Created .htaccess file');
}

function generateDeploymentInstructions() {
  console.log('\n📋 Generating deployment instructions...');
  
  const instructions = `# Next.js Node.js Deployment Instructions

## Overview
This is a **normal Next.js build** that runs with Node.js and includes:
- ✅ Working API routes
- ✅ Server-side rendering
- ✅ Session management
- ✅ Full Next.js functionality

## Files Included
- \`server.js\` - Next.js server entry point
- \`package.json\` - Dependencies
- \`startup.sh\` - Startup script
- \`.htaccess\` - URL rewriting
- \`.next/\` - Build output
- \`public/\` - Static files

## Deployment Steps

### 1. Upload Files
Upload all files from \`${CONFIG.frontend.buildDir}\` to your cPanel public_html/game/ directory:

\`\`\`bash
# Upload via cPanel File Manager or FTP
- server.js
- package.json  
- startup.sh
- .htaccess
- .next/ (entire directory)
- public/ (entire directory)
\`\`\`

### 2. Configure Node.js Application in cPanel
1. **Go to cPanel → Node.js**
2. **Create New Application**:
   - Node.js Version: 18.x or higher
   - Application Mode: Production
   - Application Root: public_html/game
   - Application URL: /game
   - Application Startup File: server.js
   - Port: ${CONFIG.frontend.port}

3. **Environment Variables**:
   - NODE_ENV: production
   - PORT: ${CONFIG.frontend.port}
   - NEXT_PUBLIC_API_URL: ${CONFIG.backend.productionUrl}
   - NEXT_PUBLIC_BASE_PATH: /game

### 3. Install Dependencies
In cPanel Node.js interface:
\`\`\`bash
npm install --production
\`\`\`

### 4. Start Application
Click **Start** in cPanel Node.js interface

### 5. Verify Deployment
- Frontend: ${CONFIG.frontend.productionUrl}/game/
- API Test: Check browser console for working API routes
- Create Game: Should work without redirects

## Troubleshooting

### If Application Won't Start:
1. Check Node.js logs in cPanel
2. Verify port ${CONFIG.frontend.port} is available
3. Check file permissions (644 for files, 755 for directories)

### If API Routes Don't Work:
1. Verify Node.js application is running
2. Check .htaccess file is uploaded
3. Test API endpoints directly

### If Static Files Don't Load:
1. Check .next/static directory exists
2. Verify .htaccess rules for static files
3. Check browser network tab for 404s

## Benefits of This Build
- ✅ **Working API Routes**: All /api/* routes work
- ✅ **Server-Side Rendering**: Better performance
- ✅ **Session Management**: Proper session handling
- ✅ **Full Next.js Features**: No limitations

## Production URLs
- Frontend: ${CONFIG.frontend.productionUrl}/game/
- Backend API: ${CONFIG.backend.productionUrl}/api/

## Support
If you encounter issues:
1. Check cPanel Node.js logs
2. Verify environment variables
3. Test API endpoints individually
4. Check browser console for errors

This build should resolve all the redirect and session management issues!
`;
  
  fs.writeFileSync(path.join(CONFIG.frontend.buildDir, '../NODEJS_DEPLOYMENT.md'), instructions);
  console.log('✓ Created deployment instructions');
}

function generateUploadScripts() {
  console.log('\n📜 Generating upload scripts...');
  
  const deployDir = path.dirname(CONFIG.frontend.buildDir);
  
  // Windows batch script
  const windowsScript = `@echo off
echo Uploading Next.js Node.js Frontend...
echo.
echo Manual Upload Required:
echo 1. Open cPanel File Manager
echo 2. Navigate to public_html/game/
echo 3. Upload all files from: ${CONFIG.frontend.buildDir}
echo 4. Set file permissions: 644 for files, 755 for directories
echo 5. Configure Node.js application in cPanel
echo.
echo See NODEJS_DEPLOYMENT.md for detailed instructions
echo.
pause
`;
  
  fs.writeFileSync(path.join(deployDir, 'upload-frontend-nodejs.bat'), windowsScript);
  
  // Linux shell script
  const linuxScript = `#!/bin/bash
echo "Uploading Next.js Node.js Frontend..."
echo
echo "Manual Upload Required:"
echo "1. Open cPanel File Manager"
echo "2. Navigate to public_html/game/"
echo "3. Upload all files from: ${CONFIG.frontend.buildDir}"
echo "4. Set file permissions: 644 for files, 755 for directories"
echo "5. Configure Node.js application in cPanel"
echo
echo "See NODEJS_DEPLOYMENT.md for detailed instructions"
echo
read -p "Press any key to continue..."
`;
  
  fs.writeFileSync(path.join(deployDir, 'upload-frontend-nodejs.sh'), linuxScript);
  
  try {
    execSync('chmod +x ' + path.join(deployDir, 'upload-frontend-nodejs.sh'));
  } catch (error) {
    console.warn('Could not set execute permissions (Windows environment)');
  }
  
  console.log('✓ Upload scripts created');
}

function checkOverwrite() {
  if (fs.existsSync(CONFIG.frontend.buildDir)) {
    console.log(`\n⚠️  Frontend Node.js build already exists for 2025-07-11`);
    console.log(`📁 Path: ${CONFIG.frontend.buildDir}`);
    console.log('🔄 Overwriting existing build...\n');
    
    fs.rmSync(CONFIG.frontend.buildDir, { recursive: true, force: true });
  }
}

function deployFrontendNodeJS() {
  console.log('🚀 Starting Next.js Node.js Frontend Deployment...');
  console.log('================================\n');
  
  checkOverwrite();
  buildNextJSApp();
  createStartupFiles();
  generateDeploymentInstructions();
  generateUploadScripts();
  
  console.log('\n✅ Next.js Node.js deployment package created successfully!');
  console.log('================================');
  console.log(`📁 Build directory: ${CONFIG.frontend.buildDir}`);
  console.log(`📖 Instructions: ${path.join(CONFIG.frontend.buildDir, '../NODEJS_DEPLOYMENT.md')}`);
  console.log(`🐧 Linux upload: ${path.join(CONFIG.frontend.buildDir, '../upload-frontend-nodejs.sh')}`);
  console.log(`🪟 Windows upload: ${path.join(CONFIG.frontend.buildDir, '../upload-frontend-nodejs.bat')}`);
  console.log('\n📋 Next steps:');
  console.log('1. Read the Node.js deployment instructions');
  console.log('2. Upload files to cPanel');
  console.log('3. Configure Node.js application in cPanel');
  console.log('4. Start the application');
  console.log('5. Test the frontend with working API routes');
  console.log(`\n🎯 Production URL: ${CONFIG.frontend.productionUrl}/game/`);
}

// Run deployment
deployFrontendNodeJS(); 