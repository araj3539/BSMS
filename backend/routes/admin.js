const express = require('express');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const { auth } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const { requireAdmin } = require('../middleware/security');

const router = express.Router();

// Admin dashboard summary
router.get('/dashboard', auth, requireAdmin, async (req,res)=>{
  const totalSalesAgg = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, orders: { $sum: 1 } } }
  ]);
  const lowStock = await Book.find({ stock: { $lte: 5 } }).limit(50);
  const bestSellers = await Book.find().sort({ soldCount: -1 }).limit(10);
  
  res.json({
    totalSales: totalSalesAgg[0]?.totalSales || 0,
    totalOrders: totalSalesAgg[0]?.orders || 0,
    lowStock,
    bestSellers
  });
});

router.get('/audit-logs', auth, requireAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100) // Show last 100 actions
      .populate('userId', 'name email'); // Show who did it
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- UPGRADED: HYBRID RECOMMENDATION ENGINE ---
router.get('/recommendations/:bookId?', async (req,res)=>{
  const { bookId } = req.params;
  
  try {
    if(bookId) {
      // We must explicitly request the '+embedding' field because it's hidden by default in the schema
      const book = await Book.findById(bookId).select('+embedding');
      if(!book) return res.json({ similar: [], coPurchased: [] });

      // 1. SEMANTIC SEARCH: Find books with similar plot/vibes using Vectors
      let similar = [];
      if (book.embedding && book.embedding.length > 0) {
        similar = await Book.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: book.embedding,
              numCandidates: 100,
              limit: 10 // Grab top 10 to ensure we have enough after filtering
            }
          },
          // Filter out the current book itself
          { $match: { _id: { $ne: book._id } } },
          { $project: { title: 1, author: 1, price: 1, coverImageUrl: 1, rating: 1, category: 1, stock: 1 } },
          { $limit: 4 } // Return the top 4 closest semantic matches
        ]);
      } else {
         // Fallback if the book hasn't been vectorized yet
         similar = await Book.find({ category: book.category, _id: { $ne: book._id } }).sort({ soldCount:-1 }).limit(4);
      }

      // 2. COLLABORATIVE FILTERING: "Customers who bought this also bought..."
      const coPurchased = await Order.aggregate([
        // Step 1: Find all successful orders that contain THIS book
        { $match: { "items.bookId": book._id, status: { $in: ['pending', 'processing', 'shipped', 'delivered'] } } },
        // Step 2: Flatten the items array so each book is its own row
        { $unwind: "$items" },
        // Step 3: Remove the current book from the list (we don't want to recommend the book they are already looking at)
        { $match: { "items.bookId": { $ne: book._id } } },
        // Step 4: Group the remaining books and count how many times they appear
        { $group: { _id: "$items.bookId", count: { $sum: 1 } } },
        // Step 5: Sort by the most frequently co-purchased
        { $sort: { count: -1 } },
        { $limit: 4 },
        // Step 6: Join with the Books collection to get titles, prices, and images
        { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "bookDetails" } },
        { $unwind: "$bookDetails" },
        // Step 7: Replace the root structure to return clean book objects
        { $replaceRoot: { newRoot: "$bookDetails" } }
      ]);

      return res.json({ similar, coPurchased });
      
    } else {
      // General fallback for the home page (if called without an ID)
      const best = await Book.find().sort({ soldCount:-1 }).limit(8);
      const newArrivals = await Book.find().sort({ createdAt:-1 }).limit(8);
      return res.json({ similar: best, coPurchased: newArrivals });
    }
  } catch (err) {
    console.error("Recommendation Engine Error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

module.exports = router;