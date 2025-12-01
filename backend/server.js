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

// --- 1. SECURITY HEADERS (Helmet) ---
app.use(helmet());

// --- 2. RATE LIMITING ---
// Limit requests from same IP to 100 per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
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
      return callback(new Error('CORS policy violation: Origin not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// --- 4. STRIPE WEBHOOK (MUST BE BEFORE JSON PARSER) ---
// Keeps body raw for Stripe signature verification
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

// --- 5. BODY PARSER (Restricted Size) ---
// Prevent DoS by limiting body size to 10kb
app.use(express.json({ limit: '10kb' }));

// --- 6. DATA SANITIZATION ---
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// --- 7. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('Mongo connected'))
  .catch(err=> console.error('Mongo err', err));

// --- 8. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes); // Use variable for consistency
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