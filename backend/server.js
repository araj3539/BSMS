// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- SECURITY MIDDLEWARE IMPORTS ---
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Import Routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const orderRoutes = require('./routes/orders');

const app = express();

// --- FIX 1: TRUST PROXY (Required for Render) ---
app.set('trust proxy', 1);

// --- 1. SECURITY HEADERS (Helmet) ---
app.use(helmet());

// --- 2. RATE LIMITING ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api', limiter);

// --- 3. GLOBAL MIDDLEWARE (CORS) - UPDATED ---
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, webhooks)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://bsms-zeta.vercel.app", 
      "http://localhost:5173",
      "http://localhost:5174" // Common alternate local port
    ];

    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check for ANY Vercel deployment (Previews & Production)
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // Log the blocked origin so you can debug it
    console.error("❌ CORS Blocked Origin:", origin);
    return callback(new Error('CORS policy violation: Origin not allowed'), false);
  },
  credentials: true
}));

// --- 4. BODY PARSER (With Raw Body Capture for Stripe) ---
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// --- 5. DATA SANITIZATION ---
app.use(mongoSanitize());
app.use(xss());

// --- 6. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('Mongo connected'))
  .catch(err=> console.error('Mongo err', err));

// --- 7. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

// --- 8. PING ---
app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));