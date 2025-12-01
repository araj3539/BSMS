require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./logger');

// Import Routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const orderRoutes = require('./routes/orders'); // <--- Ensure this is imported

const app = express();

// --- 1. STRIPE WEBHOOK (MUST BE FIRST) ---
// This middleware tells Express to keep the body raw for this specific route
// so Stripe can verify the signature.
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

// --- 2. GLOBAL MIDDLEWARE (CORS) ---
// We explicitly allow your Vercel frontend to prevent "Block" errors

const allowedOrigin = process.env.FRONTEND_ORIGIN || 'https://bsms-zeta.vercel.app';
app.use(cors({ origin: allowedOrigin }));

// --- 3. JSON PARSING ---
// Parses JSON for all routes EXCEPT the webhook (handled above)
app.use(express.json());

// --- 4. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('Mongo connected'))
  .catch(err=> console.error('Mongo err', err));

// --- 5. ROUTES ---
// (I removed the duplicate lines from your previous file)
app.use('/api/auth', authRoutes);
app.use('/api/books', require('./routes/books'));
app.use('/api/orders', orderRoutes); 
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

// --- 6. PING (Keep-Alive for Render) ---
app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info('Server listening on %d', PORT));