// backend/routes/books.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Order = require('../models/Order');
const { auth, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

// --- HELPER: Escape Regex for Security ---
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// GET /api/books
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, minRating, sort, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(200, Number(limit) || 20));

    const filter = {};

    // SECURITY: Sanitize the search query to prevent ReDoS
    if (q) {
      const cleanQ = escapeRegex(q);
      filter.$or = [
        { title: new RegExp(cleanQ, 'i') },
        { author: new RegExp(cleanQ, 'i') },
        { isbn: new RegExp(cleanQ, 'i') },
        { category: new RegExp(cleanQ, 'i') },
      ];
    }

    if (category) filter.category = category;

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

router.post('/', auth, isAdmin, validateBook, async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/bulk', auth, isAdmin, upload.single('file'), async (req, res) => {
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
          coverImageUrl: data.coverImageUrl || '' 
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
});

router.put('/:id', auth, isAdmin, validateBook, async (req, res) => {
  try {
    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const removed = await Book.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ msg: 'Not found' });
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/:id/reviews/:reviewId', auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: 'Book not found' });
    
    const review = book.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ msg: 'Review not found' });
    
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
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

module.exports = router;