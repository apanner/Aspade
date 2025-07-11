const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: 'https://www.apanner.com',
  endpoints: [
    { name: 'Health Check', path: '/health', method: 'GET' },
    { name: 'API Root', path: '/api', method: 'GET' },
    { name: 'Server Root', path: '/', method: 'GET' },
    { name: 'Admin Games', path: '/api/admin/games', method: 'GET' },
    { name: 'Admin Players', path: '/api/admin/players', method: 'GET' }
  ]
};

// HTTP request helper
function makeRequest(url, method = 'GET', timeout = 10000) {
  return new Promise((resolve, reject) => {
    const requestModule = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      timeout: timeout,
      headers: {
        'User-Agent': 'Backend-Test-Script/1.0',
        'Accept': 'application/json'
      }
    };

    const req = requestModule.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
            rawBody: body
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test individual endpoint
async function testEndpoint(endpoint) {
  const url = `${CONFIG.baseUrl}${endpoint.path}`;
  console.log(`\n🧪 Testing ${endpoint.name}`);
  console.log(`   ${endpoint.method} ${url}`);
  
  try {
    const response = await makeRequest(url, endpoint.method);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ Success (${response.statusCode})`);
      if (response.body) {
        console.log(`   📄 Response: ${JSON.stringify(response.body, null, 2)}`);
      }
      return { success: true, response };
    } else if (response.statusCode === 404) {
      console.log(`   ❌ Not Found (${response.statusCode})`);
      console.log(`   📄 Response: ${response.rawBody || 'No response body'}`);
      return { success: false, error: 'Route not found', response };
    } else {
      console.log(`   ⚠️  Warning (${response.statusCode})`);
      console.log(`   📄 Response: ${response.rawBody || 'No response body'}`);
      return { success: false, error: `HTTP ${response.statusCode}`, response };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.message.includes('ENOTFOUND')) {
      console.log(`   💡 DNS resolution failed - check domain name`);
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log(`   💡 Connection refused - server not running`);
    }
    return { success: false, error: error.message };
  }
}

// Main test function
async function testBackendDeployment() {
  console.log('🚀 Testing Backend Deployment');
  console.log('=' .repeat(60));
  console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);
  console.log(`📅 Test Time: ${new Date().toISOString()}`);
  
  const results = [];
  
  for (const endpoint of CONFIG.endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({
      endpoint: endpoint.name,
      success: result.success,
      error: result.error,
      statusCode: result.response?.statusCode
    });
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === 0) {
    console.log('\n🔴 CRITICAL: No endpoints are working!');
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check if Node.js app is running in cPanel');
    console.log('2. Verify the application status is "Running"');
    console.log('3. Check application logs for errors');
    console.log('4. Restart the Node.js application');
    console.log('5. Verify domain name and DNS settings');
  } else if (successCount < totalCount) {
    console.log('\n🟡 PARTIAL: Some endpoints are working');
    console.log('\n📋 Failed Endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.endpoint}: ${r.error}`);
    });
  } else {
    console.log('\n🟢 EXCELLENT: All endpoints are working!');
    console.log('\n🎉 Your backend is deployed and running correctly!');
  }
  
  // Specific guidance
  console.log('\n' + '=' .repeat(60));
  console.log('🔍 Diagnostic Information');
  console.log('=' .repeat(60));
  
  const healthResult = results.find(r => r.endpoint === 'Health Check');
  const apiResult = results.find(r => r.endpoint === 'API Root');
  const rootResult = results.find(r => r.endpoint === 'Server Root');
  
  if (healthResult?.success) {
    console.log('✅ Health endpoint working - Server is running');
  } else {
    console.log('❌ Health endpoint failed - Server may not be running');
  }
  
  if (apiResult?.success) {
    console.log('✅ API endpoint working - Routes are configured');
  } else {
    console.log('❌ API endpoint failed - Check routing configuration');
  }
  
  if (rootResult?.success) {
    console.log('✅ Root endpoint working - Basic server functionality OK');
  } else {
    console.log('❌ Root endpoint failed - Basic server issues');
  }
  
  console.log('\n🔗 Test these URLs in your browser:');
  CONFIG.endpoints.forEach(endpoint => {
    const status = results.find(r => r.endpoint === endpoint.name)?.success ? '✅' : '❌';
    console.log(`   ${status} ${CONFIG.baseUrl}${endpoint.path}`);
  });
}

// Run the test
console.log('🔍 Backend Deployment Test Script');
console.log('This script will test your deployed backend server');
console.log('');

testBackendDeployment().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
}); 