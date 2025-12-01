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
// Tells Express to trust the Load Balancer's headers (X-Forwarded-For)
// '1' means trust the first proxy hop, which is standard for Render.
app.set('trust proxy', 1);

// --- 1. SECURITY HEADERS (Helmet) ---
app.use(helmet());

// --- 2. RATE LIMITING ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// --- 3. GLOBAL MIDDLEWARE (CORS) ---
const allowedOrigins = [
  "https://bsms-zeta.vercel.app", 
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // return callback(new Error('CORS policy violation'), false);
      return callback(null, true); 
    }
    return callback(null, true);
  },
  credentials: true
}));

// --- 4. BODY PARSER (With Raw Body Capture) ---
// This replaces the previous separate 'express.raw' and 'express.json' setup.
// We verify the JSON and save the raw buffer to 'req.rawBody' for Stripe.
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