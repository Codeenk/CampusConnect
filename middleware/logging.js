const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Logger utility
class Logger {
  static log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      meta
    };

    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m', // White
      SUCCESS: '\x1b[32m' // Green
    };
    const resetColor = '\x1b[0m';
    
    console.log(`${colors[level] || ''}[${level}] ${timestamp}: ${message}${resetColor}`);
    if (Object.keys(meta).length > 0) {
      console.log(`${colors[level] || ''}Meta:${resetColor}`, meta);
    }

    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }
  }

  static error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  static info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  static debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, meta);
    }
  }

  static success(message, meta = {}) {
    this.log('SUCCESS', message, meta);
  }
}

// Enhanced error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default error
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  Logger.error('API Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    error = { message: 'Database error', statusCode: 500 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      stack: error.stack,
      details: error
    } : 'Something went wrong',
    requestId: req.id || 'unknown'
  });
};

// Request ID middleware for tracking
const addRequestId = (req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.set('X-Request-ID', req.id);
  next();
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      requestId: req.id
    };

    if (res.statusCode >= 400) {
      Logger.warn(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, logData);
    } else {
      Logger.info(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, logData);
    }
  });

  next();
};

module.exports = {
  Logger,
  errorHandler,
  addRequestId,
  requestLogger
};