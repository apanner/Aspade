const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const PROJECT_NAME = 'Aspade';
const FRONTEND_DIR = path.join(__dirname); // Root directory is the frontend
const BACKEND_DIR = path.join(__dirname, 'serv');
const FRONTEND_SERVICE_NAME = 'frontend';
const BACKEND_SERVICE_NAME = 'backend';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper function to execute commands and log output
function runCommand(command, cwd = __dirname) {
  console.log(`${colors.yellow}> ${command}${colors.reset}`);
  try {
    const output = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env }
    });
    return { success: true, output };
  } catch (error) {
    console.error(`${colors.red}Command failed: ${command}${colors.reset}`);
    console.error(error.message);
    return { success: false, error };
  }
}

// Check if Railway CLI is installed
function checkRailwayCLI() {
  try {
    execSync('npx @railway/cli --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Railway CLI is not installed. Installing...${colors.reset}`);
    runCommand('npm install -g @railway/cli');
    return false;
  }
}

// Check if user is logged in to Railway
function checkRailwayLogin() {
  try {
    const output = execSync('npx @railway/cli whoami', { stdio: 'pipe' }).toString();
    console.log(`${colors.green}Logged in as: ${output.trim()}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Not logged in to Railway. Please login first.${colors.reset}`);
    runCommand('npx @railway/cli login');
    return false;
  }
}

// Create or link to a project
async function setupProject() {
  console.log(`\n${colors.bright}${colors.cyan}Setting up project ${PROJECT_NAME}...${colors.reset}\n`);
  
  try {
    // Just use the project command to select or create a project
    runCommand(`npx @railway/cli project`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed to setup project: ${error.message}${colors.reset}`);
    return false;
  }
}

// Deploy a service to Railway
async function deployService(serviceName, directory, envVars = {}) {
  console.log(`\n${colors.bright}${colors.cyan}Deploying ${serviceName}...${colors.reset}\n`);
  
  // Link to the project
  runCommand(`npx @railway/cli link`, directory);
  
  // Set environment variables if provided
  if (Object.keys(envVars).length > 0) {
    console.log(`${colors.yellow}Setting environment variables for ${serviceName}...${colors.reset}`);
    
    for (const [key, value] of Object.entries(envVars)) {
      runCommand(`npx @railway/cli variables set ${key}=${value}`, directory);
    }
  }
  
  // Deploy the service
  const result = runCommand(`npx @railway/cli up --service ${serviceName}`, directory);
  
  if (result.success) {
    console.log(`\n${colors.green}✓ ${serviceName} deployed successfully!${colors.reset}`);
    
    // Get the service URL
    try {
      const urlOutput = execSync(`npx @railway/cli status --service ${serviceName}`, { cwd: directory }).toString();
      const urlMatch = urlOutput.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        console.log(`${colors.green}Service URL: ${urlMatch[0]}${colors.reset}`);
      }
    } catch (error) {
      // Ignore errors when trying to get the URL
    }
    
    return true;
  } else {
    console.error(`\n${colors.red}✗ Failed to deploy ${serviceName}${colors.reset}`);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log(`\n${colors.bright}${colors.cyan}=== Railway Deployment Script ===${colors.reset}\n`);
  
  // Check prerequisites
  checkRailwayCLI();
  checkRailwayLogin();
  
  // Setup project
  const projectSetup = await setupProject();
  if (!projectSetup) {
    console.error(`${colors.red}Failed to setup project. Aborting deployment.${colors.reset}`);
    return;
  }
  
  // Deploy backend with environment variables
  const backendEnvVars = {
    NODE_ENV: 'production',
    PORT: '3001'
  };
  
  const backendSuccess = await deployService(BACKEND_SERVICE_NAME, BACKEND_DIR, backendEnvVars);
  
  // Get backend URL for frontend environment variables
  let backendUrl = '';
  if (backendSuccess) {
    try {
      const urlOutput = execSync(`npx @railway/cli status --service ${BACKEND_SERVICE_NAME}`, { cwd: BACKEND_DIR }).toString();
      const urlMatch = urlOutput.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        backendUrl = urlMatch[0];
      }
    } catch (error) {
      // Ignore errors when trying to get the URL
    }
  }
  
  // Deploy frontend with environment variables
  const frontendEnvVars = {
    NODE_ENV: 'production',
    PORT: '3000',
    NEXT_PUBLIC_API_URL: backendUrl || 'http://localhost:3001'
  };
  
  const frontendSuccess = await deployService(FRONTEND_SERVICE_NAME, FRONTEND_DIR, frontendEnvVars);
  
  // Summary
  console.log(`\n${colors.bright}${colors.cyan}=== Deployment Summary ===${colors.reset}`);
  console.log(`Backend: ${backendSuccess ? colors.green + '✓ Success' : colors.red + '✗ Failed'}${colors.reset}`);
  console.log(`Frontend: ${frontendSuccess ? colors.green + '✓ Success' : colors.red + '✗ Failed'}${colors.reset}`);
  
  if (backendSuccess && frontendSuccess) {
    console.log(`\n${colors.green}${colors.bright}All services deployed successfully!${colors.reset}`);
    console.log(`\n${colors.yellow}Visit the Railway dashboard for more details: https://railway.app/dashboard${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}Some services failed to deploy. Check the logs above for details.${colors.reset}`);
  }
}

// Run the deployment
deploy().catch(error => {
  console.error(`${colors.red}Deployment failed:${colors.reset}`, error);
  process.exit(1);
}); 