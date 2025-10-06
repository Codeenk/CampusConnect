const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiting');
const { errorHandler, addRequestId, requestLogger } = require('./middleware/logging');

// Load environment variables
dotenv.config();

// Check critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// Validate JWT secret strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long for security');
  process.exit(1);
}

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const postRoutes = require('./routes/posts');
const endorseRoutes = require('./routes/endorse');
const resumeRoutes = require('./routes/resume');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));
app.use(addRequestId);
app.use(requestLogger);
app.use(generalLimiter);

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/endorse', endorseRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// ✅ Root route (optional but helpful)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Welcome to Campus Connect Backend API!',
    docs: '/api/health for health check',
    time: new Date().toISOString()
  });
});

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Campus Connect Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Enhanced Error Handler
app.use(errorHandler);

// ❌ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Campus Connect Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
