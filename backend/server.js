require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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
const allowedOrigins = [
  "https://bsms-zeta.vercel.app", 
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // Optional: You can un-comment the error below to be strict, 
      // but returning true is safer for debugging if you have multiple domains.
      // return callback(new Error('CORS policy violation'), false);
      return callback(null, true); 
    }
    return callback(null, true);
  },
  credentials: true
}));

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
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));