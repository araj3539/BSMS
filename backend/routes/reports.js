const express = require('express');
const Order = require('../models/Order');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Sales by day (last N days)
router.get('/sales-by-day', auth, isAdmin, async (req,res)=>{
  const days = Number(req.query.days||30);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const agg = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      total: { $sum: "$totalAmount" },
      orders: { $sum: 1 }
    }},
    { $sort: { "_id": 1 } }
  ]);
  res.json(agg);
});

router.get('/category-sales', auth, isAdmin, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      // 1. Filter: Only consider paid/completed orders
      { $match: { status: { $in: ['pending', 'processing', 'shipped', 'delivered'] } } },
      
      // 2. Deconstruct: Split orders into individual items (rows)
      { $unwind: "$items" },
      
      // 3. Join: Look up the "Book" details for each item to get the Category
      {
        $lookup: {
          from: "books", // collection name in MongoDB (lowercase, plural)
          localField: "items.bookId",
          foreignField: "_id",
          as: "bookInfo"
        }
      },
      
      // 4. Flatten: Move bookInfo from an array to an object
      { $unwind: "$bookInfo" },
      
      // 5. Group: Sum revenue by Category
      {
        $group: {
          _id: "$bookInfo.category",
          value: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
        }
      },
      
      // 6. Format: Rename _id to name for Recharts
      { $project: { name: "$_id", value: 1, _id: 0 } },
      
      // 7. Sort: Highest revenue first
      { $sort: { value: -1 } }
    ]);

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
