const fs = require("fs");
const path = require("path");
const cors = require("cors");
const express = require("express");
const morgan = require('morgan');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Import routes
const placesRoutes = require("./routes/places-routes");
const friendsRoutes = require("./routes/friends-routes");
const usersRoutes = require("./routes/users-routes");
const stripeRoutes = require("./routes/stripe-routes");
const messageRoutes = require("./routes/message-routes"); // ✅ ADDED
const stockRoutes = require("./routes/stock-routes"); // ✅ ADDED (NEW)
const eventRoutes = require("./routes/event-routes");
const contactsRoutes = require('./routes/contacts-routes');  
const eventInviteRoutes = require('./routes/event-invite-routes');
const designRoutes = require('./routes/design-routes');
const publicEventRoutes = require('./routes/public-event-routes');

// Import utilities
const HttpError = require("./models/http-error");
const logger = require("./util/logger"); // ✅ ADDED (Winston logger)

// Load environment variables
require("dotenv").config();

// MongoDB connection string (use MONGODB_URI if available, otherwise construct from parts)
const uri = process.env.MONGODB_URI || (() => {
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const db = process.env.MONGO_DB;
  const hosts = process.env.MONGO_HOSTS;
  const replicaSet = process.env.MONGO_REPLICA_SET;
  const options = process.env.MONGO_OPTIONS;
  
  if (replicaSet) {
    return `mongodb://${user}:${pass}@${hosts}/${db}?replicaSet=${replicaSet}&${options}`;
  } else {
    return `mongodb+srv://${user}:${pass}@${hosts}/${db}?${options}`;
  }
})();

// Initialize Express app
const app = express();

// Morgan HTTP request logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('dev')); // Colorful development logs
}

// ============================================
// MIDDLEWARE
// ============================================

// Body parser - parse JSON request bodies
app.use(bodyParser.json());

// Serve static files (uploaded images)
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS configuration
const allowedOrigins = [
  "http://localhost:19006",
  "http://localhost:8081",   // ✅ Your frontend
  "http://localhost:8082",
  "http://localhost:3000",
  "http://localhost:19000",
  "exp://192.168.0.157:19000",
  "exp://192.168.0.165:19000",
  "https://happykid-396701.web.app",
];

// Add environment-specific origins
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// ✅ CORS middleware with proper configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      console.log('   Allowed origins:', allowedOrigins);
      callback(null, true);  // ✅ Allow anyway in development
      // In production, use: callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Additional CORS headers (for older clients)
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, PUT");
//   next();
// });

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
});

// ============================================
// API ROUTES
// ============================================

// ✅ Public routes (NO AUTH REQUIRED - must be before auth routes)
app.use('/api/public', publicEventRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount route handlers
app.use("/api/places", placesRoutes);           // Places/locations (legacy from TourDeThailand)
app.use("/api/users", usersRoutes);             // User management & authentication
app.use("/api/stripe", stripeRoutes);           // Stripe payments & connected accounts
app.use("/api/friends", friendsRoutes);         // Friend management
app.use("/api/messages", messageRoutes);        // ✅ Messages & chat (ADDED)
app.use("/api/stocks", stockRoutes);            // ✅ Stock data & trading (ADDED - NEW)
app.use('/api/contacts', contactsRoutes); 
app.use('/api/events', eventInviteRoutes);

// TODO: Add these routes as you create them
app.use("/api/events", eventRoutes);         // Investment events (TODO)
// app.use("/api/contributions", contributionRoutes);  // Contributions (TODO)
// app.use("/api/portfolio", portfolioRoutes);   // User portfolio (TODO)

// Add route
app.use('/api/designs', designRoutes);


// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - route not found
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
  });
  throw error;
});

// Global error handler
app.use((error, req, res, next) => {
  // If file was uploaded but error occurred, delete the file
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      if (err) {
        logger.error('Failed to delete uploaded file', {
          path: req.file.path,
          error: err.message,
        });
      }
    });
  }

  // If response already sent, pass to next error handler
  if (res.headerSent) {
    return next(error);
  }

  // Log the error
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    status: error.code || 500,
    message: error.message,
    stack: error.stack,
  });

  // Send error response
  res.status(error.code || 500);
  res.json({
    message: error.message || "An unknown error occurred!",
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
logger.info('Connecting to MongoDB...', {
  database: process.env.MONGO_DB || 'investmentapp',
});

mongoose
  .connect(uri)
  .then(() => {
    logger.info('MongoDB connected successfully', {
      database: mongoose.connection.name,
    });

    // Start server
    app.listen(PORT, () => {
      logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection failed', {
      error: err.message,
      stack: err.stack,
    });
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

// Handle process termination gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', {
    error: err.message,
    stack: err.stack,
  });
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason,
    promise: promise,
  });
  console.error('❌ Unhandled Rejection:', reason);
});

module.exports = app;