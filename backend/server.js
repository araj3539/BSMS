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
app.set('trust proxy', true);

// --- 4. GLOBAL MIDDLEWARE (CORS) ---
const allowed = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    console.error('❌ CORS Blocked Origin:', origin);
    return callback(new Error('CORS policy violation: Origin not allowed'), false);
  },
  credentials: true
}));

// --- 1. SECURITY HEADERS (Helmet) ---
app.use(helmet());

// --- 2. GLOBAL RATE LIMITING ---
const limitAmount = process.env.NODE_ENV === 'production' ? 100 : 10000;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: limitAmount, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api', globalLimiter);

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
// NOTE: authLimiter is NO LONGER here. It is used inside authRoutes.
app.use('/api/auth', authRoutes); 

app.use('/api/books', bookRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ai', require('./routes/ai'));

// --- 9. PING ---
app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));