# Simple Test Server

A minimal Express.js server for testing your server environment and basic API functionality.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd test_server_
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Test the server:**
   ```bash
   # In another terminal
   npm test
   ```

## Server Information

- **Port:** 3001 (default)
- **URL:** http://localhost:3001
- **Status:** The server runs with in-memory storage (resets on restart)

## Available Endpoints

### Basic Endpoints
- `GET /` - Root endpoint with server info
- `GET /health` - Health check endpoint
- `GET /test` - Simple test endpoint
- `POST /test` - POST test endpoint

### Data Endpoints
- `GET /users` - Get all users
- `POST /users` - Create a new user
- `GET /messages` - Get all messages
- `POST /messages` - Create a new message

### Counter Endpoints
- `GET /counter` - Get current counter value
- `POST /counter/increment` - Increment counter
- `POST /counter/decrement` - Decrement counter
- `POST /counter/reset` - Reset counter to 0

### Utility Endpoints
- `POST /echo` - Echo back whatever you send

## Testing the Server

### Method 1: Automated Test Script
```bash
npm test
```

### Method 2: Manual Browser Testing
Open your browser and visit:
- http://localhost:3001/
- http://localhost:3001/health
- http://localhost:3001/test
- http://localhost:3001/users
- http://localhost:3001/counter

### Method 3: Using curl
```bash
# Get server info
curl http://localhost:3001/

# Health check
curl http://localhost:3001/health

# Test POST
curl -X POST http://localhost:3001/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Create user
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Increment counter
curl -X POST http://localhost:3001/counter/increment
```

## Scripts

- `npm start` - Start the server
- `npm test` - Run automated endpoint tests
- `npm run dev` - Start with nodemon (auto-restart on changes)

## Expected Output

When the server starts successfully, you should see:
```
🚀 Simple Test Server running on port 3001
📍 Server URL: http://localhost:3001
🔍 Health check: http://localhost:3001/health
⚡ Test endpoint: http://localhost:3001/test
📝 All endpoints: http://localhost:3001/
⏰ Started at: 2024-01-01T12:00:00.000Z
```

## Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Make sure Node.js is installed
- Run `npm install` to install dependencies

### Connection refused
- Make sure the server is running
- Check if firewall is blocking the port
- Try accessing http://localhost:3001 directly

### Module not found
- Run `npm install` in the test_server_ directory
- Make sure you're in the correct directory

## Files

- `simple_server.js` - Main server file
- `test_endpoints.js` - Automated test script
- `package.json` - Dependencies and scripts
- `README.md` - This file

## Purpose

This server is designed to:
- Verify your Node.js environment is working
- Test basic Express.js functionality
- Provide simple endpoints for API testing
- Serve as a foundation for more complex servers

Once this test server works, you can be confident that your environment is properly set up for running more complex Node.js applications. 