const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const MessageWebSocketServer = require('./websocket/messageServer');

// Load environment variables
dotenv.config();

// Check critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

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
const optimizedMessageRoutes = require('./routes/messagesOptimized');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/endorse', endorseRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', optimizedMessageRoutes); // Use optimized routes
app.use('/api/messages/legacy', messageRoutes); // Keep legacy routes as fallback

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

// 🧯 Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ❌ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Create HTTP server and initialize WebSocket
const server = http.createServer(app);

// Initialize WebSocket server for real-time messaging
const wsServer = new MessageWebSocketServer(server);

// Add WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
  res.json({
    success: true,
    data: wsServer.getStats()
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Campus Connect Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready at ws://localhost:${PORT}/ws/messages`);
});

module.exports = { app, server, wsServer };
