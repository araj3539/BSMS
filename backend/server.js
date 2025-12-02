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

// --- 2. GLOBAL RATE LIMITING ---
// General limit for API calls
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api', globalLimiter);

// --- 3. AUTH RATE LIMITING (Stricter) ---
// Specific limit for Login/Signup to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts
  message: { msg: 'Too many login attempts. Please try again after 15 minutes.' }
});

// --- 4. GLOBAL MIDDLEWARE (CORS) ---
const allowed = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    
    // Allow Vercel previews dynamically
    if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    console.error('❌ CORS Blocked Origin:', origin);
    return callback(new Error('CORS policy violation: Origin not allowed'), false);
  },
  credentials: true
}));

// --- 5. BODY PARSER ---
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// --- 6. DATA SANITIZATION ---
app.use(mongoSanitize());
app.use(xss());

// --- 7. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('Mongo connected'))
  .catch(err=> console.error('Mongo err', err));

// --- 8. ROUTES ---
// Apply strict limiter to auth routes
app.use('/api/auth', authLimiter, authRoutes); 

app.use('/api/books', bookRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

// --- 9. PING ---
app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));