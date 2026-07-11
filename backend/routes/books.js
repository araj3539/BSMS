// backend/routes/books.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { getRecommendations } = require('../controllers/recommendation.controller');
const router = express.Router();
const axios = require('axios');
const Book = require('../models/Book');
const Order = require('../models/Order');
const PlaybackState = require('../models/PlaybackState');
const { auth } = require('../middleware/auth'); // Removed 'isAdmin' import
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');

// Import Security Middleware
const { requireAdmin, audit } = require('../middleware/security');
const upload = multer({ storage: multer.memoryStorage() });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



// Helper function to create vectors
async function generateBookEmbedding(title, author, category, description) {
  // Combine all relevant textual data into one block of context
  const textToEmbed = `Title: ${title}. Author: ${author}. Category: ${category}. Description: ${description}`;
  
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(textToEmbed);
  return result.embedding.values; 
}

// --- HELPER: Escape Regex for Security ---
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; 
    } catch (err) {
      console.warn("Invalid token in optional auth, proceeding as guest.");
    }
  }
  next();
};

// GET /api/books (Public)
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, minRating, sort, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(200, Number(limit) || 20));

    const filter = {};

    if (q) {
      const cleanQ = escapeRegex(q);
      filter.$or = [
        { title: new RegExp(cleanQ, 'i') },
        { author: new RegExp(cleanQ, 'i') },
        { isbn: new RegExp(cleanQ, 'i') },
        { category: new RegExp(cleanQ, 'i') },
      ];
    }

    if (category) filter.category = { $regex: category, $options: 'i' };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'top_rated') sortOption = { rating: -1 };
    else if (sort === 'bestsellers') sortOption = { soldCount: -1 };

    const skip = (pageNum - 1) * lim;

    const [total, books] = await Promise.all([
      Book.countDocuments(filter),
      Book.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(lim)
    ]);

    res.json({ books, total, page: pageNum, limit: lim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Batch Fetch (Public)
router.post('/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ msg: 'Invalid IDs format' });
    }
    const books = await Book.find({ _id: { $in: ids } })
      .select('title price stock coverImageUrl author');
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// --- NEW: MY LIBRARY ROUTE ---
// @route   GET /api/books/my-library
// @desc    Get all unique books purchased by the user
// @access  Private
router.get('/my-library', auth, async (req, res) => {
  try {
    // 1. Find all successful orders for this user
    const orders = await Order.find({
      userId: req.user.id,
      status: { $in: ['processing', 'shipped', 'delivered'] }
    });

    // 2. Extract unique book IDs using a Set to prevent duplicates
    const bookIds = new Set();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.bookId) bookIds.add(item.bookId.toString());
      });
    });

    // 3. Fetch the actual book details for those IDs
    const libraryBooks = await Book.find({
      _id: { $in: Array.from(bookIds) }
    }).select('title author coverImageUrl ebookUrl audiobookUrl category');

    res.json(libraryBooks);
  } catch (error) {
    console.error("Library Error:", error);
    res.status(500).json({ msg: 'Server Error fetching library' });
  }
});

// Get Single Book (Public)
router.get('/:id', async (req, res) => {
  try {
    const b = await Book.findById(req.params.id);
    if (!b) return res.status(404).json({ msg: 'Not found' });
    res.json(b);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

const validateBook = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }
    next();
  }
];

// Add Review (Authenticated)
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: 'Book not found' });

    const alreadyReviewed = book.reviews.find(
      (r) => r.user.toString() === req.user.id.toString()
    );
    if (alreadyReviewed) return res.status(400).json({ msg: 'Already reviewed' });

    const hasPurchased = await Order.findOne({
      userId: req.user.id,
      'items.bookId': req.params.id,
      status: { $in: ['pending', 'processing', 'shipped', 'delivered'] }
    });

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user.id,
      isVerified: !!hasPurchased
    };

    book.reviews.push(review);
    book.numReviews = book.reviews.length;
    book.rating = book.reviews.reduce((acc, item) => item.rating + acc, 0) / book.reviews.length;

    await book.save();
    res.status(201).json({ msg: 'Review added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- ADMIN ROUTES (SECURED & AUDITED) ---

// Create Book
router.post('/', 
  auth, 
  requireAdmin, // Replaced isAdmin
  audit('CREATE_BOOK'), // Activated Logging
  validateBook, 
  async (req, res) => {
    try {
      const book = new Book(req.body);
      await book.save();
      res.status(201).json(book);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Bulk Upload
router.post('/bulk', 
  auth, 
  requireAdmin, // Replaced isAdmin
  audit('BULK_IMPORT_BOOKS'), // Activated Logging
  upload.single('file'), 
  async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => {
        if(data.title && data.price) {
          results.push({
            title: data.title,
            author: data.author || 'Unknown',
            price: Number(data.price) || 0,
            stock: Number(data.stock) || 0,
            category: data.category || 'General',
            description: data.description || '',
            isbn: data.isbn || '',
            coverImageUrl: data.coverImageUrl || '' ,
            ebookUrl: data.ebookUrl || '',
            audiobookUrl: data.audiobookUrl || ''
          });
        }
      })
      .on('end', async () => {
        try {
          if (results.length === 0) return res.status(400).json({ msg: 'CSV is empty or invalid' });
          await Book.insertMany(results);
          res.json({ msg: `Successfully added ${results.length} books` });
        } catch (err) {
          console.error(err);
          res.status(500).json({ msg: 'Failed to import books', error: err.message });
        }
      });
  }
);

// Update Book
router.put('/:id', 
  auth, 
  requireAdmin, // Replaced isAdmin
  audit('UPDATE_BOOK'), // Activated Logging
  validateBook, 
  async (req, res) => {
    try {
      const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ msg: 'Not found' });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Delete Book
router.delete('/:id', 
  auth, 
  requireAdmin, // Replaced isAdmin
  audit('DELETE_BOOK'), // Activated Logging
  async (req, res) => {
    try {
      const removed = await Book.findByIdAndDelete(req.params.id);
      if (!removed) return res.status(404).json({ msg: 'Not found' });
      res.json({ msg: 'Deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Delete Review (Admin Action)
router.delete('/:id/reviews/:reviewId', auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: 'Book not found' });
    
    const review = book.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ msg: 'Review not found' });
    
    // Allow user or admin to delete
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Optional: Add audit for admin deleting user reviews
    if (req.user.role === 'admin' && review.user.toString() !== req.user.id) {
       // Ideally you could call logAudit here directly if imported
    }

    book.reviews.pull(req.params.reviewId);
    book.numReviews = book.reviews.length;
    book.rating = book.reviews.length > 0
      ? book.reviews.reduce((acc, item) => item.rating + acc, 0) / book.reviews.length
      : 0;

    await book.save();
    res.json({ msg: 'Review removed' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

router.put('/:id/reviews/:reviewId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: 'Book not found' });
    const review = book.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ msg: 'Review not found' });
    if (review.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;
    book.rating = book.reviews.reduce((acc, item) => item.rating + acc, 0) / book.reviews.length;

    await book.save();
    res.json({ msg: 'Review updated' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

router.post('/:id/reviews/:reviewId/replies', auth, async (req, res) => {
  try {
    const { comment } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: 'Book not found' });
    const review = book.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ msg: 'Review not found' });

    review.replies.push({
      user: req.user.id,
      name: req.user.name,
      comment
    });
    await book.save();
    res.json({ msg: 'Reply added' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// --- NEW SECURE READER ROUTE ---
// @route   GET /api/books/:id/read
// @desc    Get book access links ONLY if user has purchased it
// @access  Private
router.get('/:id/read', auth, async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.user.id; // Corrected to req.user.id to match your auth middleware

    // 1. Check if the user has a completed order containing this book
    const hasPurchased = await Order.findOne({
      userId: userId,
      'items.bookId': bookId,
      status: { $in: ['processing', 'shipped', 'delivered'] } // Assuming these mean paid
    });

    // 2. If they are an admin, let them read it anyway for testing
    const isAdmin = req.user.role === 'admin';

    if (!hasPurchased && !isAdmin) {
      return res.status(403).json({ message: "You must purchase this book to read it." });
    }

    // 3. Fetch the book and send the secure URL
    const book = await Book.findById(bookId).select('title ebookUrl audiobookUrl');
    
    if (!book || (!book.ebookUrl && !book.audiobookUrl)) {
      return res.status(404).json({ message: "Digital format not available for this book." });
    }

    res.json({
      title: book.title,
      ebookUrl: book.ebookUrl,
      audiobookUrl: book.audiobookUrl
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error verifying access" });
  }
});

// @route   GET /api/books/:id/download-epub
// @desc    Securely fetch the EPUB file as an ArrayBuffer and send it to the frontend
// @access  Private
router.get('/:id/download-epub', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Book ID format' });
    }

    const bookId = req.params.id;
    const userId = req.user.id; 

    // Verify purchase
    const hasPurchased = await Order.findOne({
      userId: userId,
      'items.bookId': bookId,
      status: { $in: ['processing', 'shipped', 'delivered'] } 
    });

    const isAdmin = req.user.role === 'admin';

    if (!hasPurchased && !isAdmin) {
      return res.status(403).json({ message: "You must purchase this book to read it." });
    }

    const book = await Book.findById(bookId).select('ebookUrl');
    
    if (!book || !book.ebookUrl) {
      return res.status(404).json({ message: "Digital format not available." });
    }

    // --- THE FIX: Add Headers to fake a real Chrome browser ---
    const response = await axios.get(book.ebookUrl, { 
      responseType: 'arraybuffer',
      maxRedirects: 5, // Gutenberg uses multiple redirects, we must follow them
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/epub+zip, application/pdf, text/html, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });

    // Send the raw file data back to our React app
    res.setHeader('Content-Type', 'application/epub+zip');
    res.send(response.data);

  } catch (error) {
    console.error("Proxy Error Details:", error.response ? error.response.status : error.message);
    res.status(500).json({ message: "Failed to securely load the ebook file from the source." });
  }
});

// --- NEW: SMART BOOKMARKING ROUTES ---

// @route   GET /api/books/:id/playback-state
// @desc    Get the user's last saved playback position
// @access  Private
router.get('/:id/playback-state', auth, async (req, res) => {
  try {
    const state = await PlaybackState.findOne({ userId: req.user.id, bookId: req.params.id });
    res.json(state || { trackIndex: 0, currentTime: 0 }); // Return 0s if they haven't started listening yet
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error loading playback state' });
  }
});

// @route   PUT /api/books/:id/playback-state
// @desc    Update the user's playback position
// @access  Private
router.put('/:id/playback-state', auth, async (req, res) => {
  try {
    const { trackIndex, currentTime } = req.body;
    
    // findOneAndUpdate with upsert: true will create the document if it doesn't exist, or update it if it does
    const state = await PlaybackState.findOneAndUpdate(
      { userId: req.user.id, bookId: req.params.id },
      { trackIndex, currentTime },
      { new: true, upsert: true } 
    );
    
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error saving playback state' });
  }
});

router.get('/:id/recommendations', optionalAuth, getRecommendations);

module.exports = router;