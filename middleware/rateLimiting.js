const rateLimit = require('express-rate-limit');

// General API rate limiter - 1000 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// Strict limiter for auth endpoints - 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      error: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Message sending limiter - 200 messages per hour
const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // limit each IP to 200 messages per hour
  message: {
    success: false,
    message: 'Message rate limit exceeded, please slow down.',
    error: 'MESSAGE_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    console.warn(`Message rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Message rate limit exceeded, please slow down.',
      error: 'MESSAGE_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Upload limiter - 50 uploads per hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 uploads per hour
  message: {
    success: false,
    message: 'Upload rate limit exceeded, please try again later.',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    console.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Upload rate limit exceeded, please try again later.',
      error: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Search limiter - 300 searches per hour
const searchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 300, // limit each IP to 300 searches per hour
  message: {
    success: false,
    message: 'Search rate limit exceeded, please try again later.',
    error: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    console.warn(`Search rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Search rate limit exceeded, please try again later.',
      error: 'SEARCH_RATE_LIMIT_EXCEEDED'
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  searchLimiter
};