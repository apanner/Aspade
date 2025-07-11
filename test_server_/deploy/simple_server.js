const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple in-memory storage for testing
let testData = {
  users: [],
  messages: [],
  counter: 0
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Test Server is Running!',
    status: 'success',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      health: '/health',
      test: '/test',
      users: '/users',
      messages: '/messages',
      counter: '/counter'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!',
    method: 'GET',
    timestamp: new Date().toISOString(),
    query: req.query,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type')
    }
  });
});

// POST test endpoint
app.post('/test', (req, res) => {
  res.json({
    message: 'POST test endpoint working!',
    method: 'POST',
    timestamp: new Date().toISOString(),
    body: req.body,
    query: req.query
  });
});

// Simple users endpoint
app.get('/users', (req, res) => {
  res.json({
    users: testData.users,
    count: testData.users.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const user = {
    id: Date.now().toString(),
    name,
    email: email || '',
    createdAt: new Date().toISOString()
  };
  
  testData.users.push(user);
  
  res.status(201).json({
    message: 'User created successfully',
    user,
    totalUsers: testData.users.length
  });
});

// Simple messages endpoint
app.get('/messages', (req, res) => {
  res.json({
    messages: testData.messages,
    count: testData.messages.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/messages', (req, res) => {
  const { message, author } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const newMessage = {
    id: Date.now().toString(),
    message,
    author: author || 'Anonymous',
    timestamp: new Date().toISOString()
  };
  
  testData.messages.push(newMessage);
  
  res.status(201).json({
    message: 'Message created successfully',
    data: newMessage,
    totalMessages: testData.messages.length
  });
});

// Simple counter endpoint
app.get('/counter', (req, res) => {
  res.json({
    counter: testData.counter,
    timestamp: new Date().toISOString()
  });
});

app.post('/counter/increment', (req, res) => {
  testData.counter++;
  res.json({
    message: 'Counter incremented',
    counter: testData.counter,
    timestamp: new Date().toISOString()
  });
});

app.post('/counter/decrement', (req, res) => {
  testData.counter--;
  res.json({
    message: 'Counter decremented',
    counter: testData.counter,
    timestamp: new Date().toISOString()
  });
});

app.post('/counter/reset', (req, res) => {
  testData.counter = 0;
  res.json({
    message: 'Counter reset',
    counter: testData.counter,
    timestamp: new Date().toISOString()
  });
});

// Echo endpoint - returns whatever you send
app.post('/echo', (req, res) => {
  res.json({
    message: 'Echo response',
    echo: req.body,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /test',
      'POST /test',
      'GET /users',
      'POST /users',
      'GET /messages',
      'POST /messages',
      'GET /counter',
      'POST /counter/increment',
      'POST /counter/decrement',
      'POST /counter/reset',
      'POST /echo'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Test Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📝 All endpoints: http://localhost:${PORT}/`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

module.exports = app; 