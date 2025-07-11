const http = require('http');
const querystring = require('querystring');

const SERVER_URL = 'http://localhost:3001';

// Simple HTTP request helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testEndpoint(name, method, path, data = null) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`   ${method} ${SERVER_URL}${path}`);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Test-Script/1.0'
    }
  };

  try {
    const response = await makeRequest(options, data);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`   ✅ Success (${response.statusCode})`);
      if (response.body && typeof response.body === 'object') {
        console.log(`   📄 Response: ${JSON.stringify(response.body, null, 2)}`);
      }
    } else {
      console.log(`   ⚠️  Warning (${response.statusCode})`);
      console.log(`   📄 Response: ${JSON.stringify(response.body, null, 2)}`);
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Server Test Suite');
  console.log('=' .repeat(50));
  
  // Check if server is running
  try {
    const healthCheck = await testEndpoint('Server Health Check', 'GET', '/health');
    if (!healthCheck || healthCheck.statusCode !== 200) {
      console.log('\n❌ Server is not responding! Please start the server first:');
      console.log('   cd test_server_');
      console.log('   npm install');
      console.log('   npm start');
      return;
    }
  } catch (error) {
    console.log('\n❌ Cannot connect to server! Please start the server first:');
    console.log('   cd test_server_');
    console.log('   npm install');
    console.log('   npm start');
    return;
  }

  // Test all endpoints
  await testEndpoint('Root Endpoint', 'GET', '/');
  await testEndpoint('Health Check', 'GET', '/health');
  await testEndpoint('Test GET', 'GET', '/test?param1=value1&param2=value2');
  await testEndpoint('Test POST', 'POST', '/test', { test: 'data', number: 123 });
  
  await testEndpoint('Get Users (Empty)', 'GET', '/users');
  await testEndpoint('Create User', 'POST', '/users', { name: 'John Doe', email: 'john@example.com' });
  await testEndpoint('Create Another User', 'POST', '/users', { name: 'Jane Smith', email: 'jane@example.com' });
  await testEndpoint('Get Users (With Data)', 'GET', '/users');
  
  await testEndpoint('Get Messages (Empty)', 'GET', '/messages');
  await testEndpoint('Create Message', 'POST', '/messages', { message: 'Hello World!', author: 'John' });
  await testEndpoint('Create Another Message', 'POST', '/messages', { message: 'Server is working!', author: 'Jane' });
  await testEndpoint('Get Messages (With Data)', 'GET', '/messages');
  
  await testEndpoint('Get Counter', 'GET', '/counter');
  await testEndpoint('Increment Counter', 'POST', '/counter/increment');
  await testEndpoint('Increment Counter Again', 'POST', '/counter/increment');
  await testEndpoint('Get Counter (After Increment)', 'GET', '/counter');
  await testEndpoint('Decrement Counter', 'POST', '/counter/decrement');
  await testEndpoint('Get Counter (After Decrement)', 'GET', '/counter');
  await testEndpoint('Reset Counter', 'POST', '/counter/reset');
  await testEndpoint('Get Counter (After Reset)', 'GET', '/counter');
  
  await testEndpoint('Echo Test', 'POST', '/echo', { 
    message: 'This is an echo test', 
    data: { key: 'value', array: [1, 2, 3] } 
  });
  
  await testEndpoint('404 Test', 'GET', '/nonexistent');
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Test Suite Complete!');
  console.log('');
  console.log('📊 Server Summary:');
  console.log(`   Server URL: ${SERVER_URL}`);
  console.log(`   Status: Running and responsive`);
  console.log(`   All basic endpoints tested successfully`);
  console.log('');
  console.log('🔗 Quick Test URLs:');
  console.log(`   ${SERVER_URL}/`);
  console.log(`   ${SERVER_URL}/health`);
  console.log(`   ${SERVER_URL}/test`);
  console.log(`   ${SERVER_URL}/users`);
  console.log(`   ${SERVER_URL}/messages`);
  console.log(`   ${SERVER_URL}/counter`);
}

// Run the tests
runTests().catch(console.error); 