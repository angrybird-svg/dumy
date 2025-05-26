
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express
const app = express();

// Enhanced CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection (Unchanged)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Enhanced Health Check Route
app.get('/', (req, res) => res.json({ 
  status: 'running',
  backend: 'Node.js',
  database: 'MongoDB',
  timestamp: new Date().toISOString(),
  endpoints: {
    interviews: {
      create: 'POST /api/interviews',
      list: 'GET /api/interviews'
    },
    ai: 'POST /api/test-ai'
  }
}));

// Routes (Unchanged)
const interviewRouter = require('./routes/interviews');
const testAIRouter = require('./routes/testAI');
const jobRolesRouter = require('./routes/jobRoles');
app.use('/api/job-roles', jobRolesRouter);
app.use('/api/interviews', interviewRouter);
app.use('/api/test-ai', testAIRouter);

// Enhanced 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    documentation: {
      baseURL: process.env.BASE_URL || 'http://localhost:5000',
      availableEndpoints: [
        { method: 'GET', path: '/', description: 'Service health check' },
        { method: 'POST', path: '/api/interviews', description: 'Create new interview' },
        { method: 'GET', path: '/api/interviews', description: 'List all interviews' },
        { method: 'POST', path: '/api/test-ai', description: 'Get AI feedback' }
      ]
    }
  });
});

// Global Error Handler (Unchanged)
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', {
    path: req.originalUrl,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.id,
    details: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

// Server Startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📄 API Documentation: ${process.env.BASE_URL || `http://localhost:${PORT}`}
  🌐 Allowed Origins: http://localhost:3000, http://127.0.0.1:5500, http://localhost:5500
  `);
});
