const fs = require('fs');
const path = require('path');

console.log('🏗️  Building Test Server for cPanel Deployment...');

// Create deployment directory
const deployDir = path.join(__dirname, 'deploy');
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
}

// Copy necessary files for production
const filesToCopy = [
  'simple_server.js',
  'package.json'
];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(deployDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`📄 Copied ${file}`);
  } else {
    console.log(`⚠️  Warning: ${file} not found`);
  }
});

// Create production package.json (without devDependencies)
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
delete packageJson.devDependencies;
packageJson.scripts = {
  start: "node simple_server.js"
};

fs.writeFileSync(
  path.join(deployDir, 'package.json'), 
  JSON.stringify(packageJson, null, 2)
);

// Create .htaccess file for cPanel
const htaccessContent = `# Node.js app configuration
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ simple_server.js [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# CORS headers (if needed)
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
`;

fs.writeFileSync(path.join(deployDir, '.htaccess'), htaccessContent);

// Create startup script for cPanel
const startupScript = `#!/bin/bash
# cPanel Node.js startup script

echo "🚀 Starting Test Server..."
echo "📍 Working directory: $(pwd)"
echo "📝 Node.js version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Install dependencies
echo "📥 Installing dependencies..."
npm install --production

# Start the server
echo "🟢 Starting server..."
node simple_server.js
`;

fs.writeFileSync(path.join(deployDir, 'startup.sh'), startupScript);

// Create README for deployment
const deployReadme = `# Test Server - cPanel Deployment

This folder contains the production-ready version of the test server.

## Files:
- \`simple_server.js\` - Main server file
- \`package.json\` - Production dependencies
- \`.htaccess\` - Apache configuration
- \`startup.sh\` - Server startup script
- \`README.md\` - This file

## cPanel Deployment Instructions:

### Step 1: Upload Files
1. Compress this entire folder into a ZIP file
2. Login to your cPanel
3. Go to File Manager
4. Navigate to your domain's public folder or subdomain
5. Upload and extract the ZIP file

### Step 2: Set up Node.js App
1. In cPanel, go to "Node.js Apps" or "Setup Node.js App"
2. Click "Create Application"
3. Configure:
   - Node.js Version: 14.x or higher
   - Application Root: /path/to/your/uploaded/files
   - Application URL: your-domain.com/api (or subdomain)
   - Startup File: simple_server.js
   - Environment: production

### Step 3: Install Dependencies
1. In the Node.js app interface, click "Run NPM Install"
2. Or use Terminal: \`npm install --production\`

### Step 4: Start the Application
1. Click "Start" in the Node.js app interface
2. Or use Terminal: \`node simple_server.js\`

### Step 5: Test the Server
Visit: https://your-domain.com/api/health

## Environment Variables (if needed):
- PORT: Will be set automatically by cPanel
- NODE_ENV: production

## Troubleshooting:
- Check cPanel Error Logs
- Verify Node.js version compatibility
- Ensure all dependencies are installed
- Check file permissions

## Support:
If you encounter issues, check:
1. cPanel Node.js documentation
2. Server error logs
3. Application logs
`;

fs.writeFileSync(path.join(deployDir, 'README.md'), deployReadme);

console.log('✅ Build complete!');
console.log('📁 Deploy folder created with production files');
console.log('📤 Ready for cPanel upload');
console.log('');
console.log('Next steps:');
console.log('1. Compress the "deploy" folder into a ZIP file');
console.log('2. Upload to your cPanel hosting');
console.log('3. Set up Node.js app in cPanel');
console.log('4. Install dependencies and start the server'); 