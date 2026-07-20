const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Book = require("../../models/Book");

class FrequentlyBoughtTogether {
  /**
   * ------------------------------------------------------
   * Frequently bought with ONE book
   * ------------------------------------------------------
   */
  async recommend(bookId, limit = 10) {
    const objectId = new mongoose.Types.ObjectId(bookId);

    const pipeline = [
      // Only completed orders
      {
        $match: {
          status: {
            $in: ["processing", "shipped", "delivered"],
          },
        },
      },

      // Orders containing this book
      {
        $match: {
          "items.bookId": objectId,
        },
      },

      // Expand order items
      {
        $unwind: "$items",
      },

      // Remove selected book
      {
        $match: {
          "items.bookId": {
            $ne: objectId,
          },
        },
      },

      // Count frequency
      {
        $group: {
          _id: "$items.bookId",
          purchaseCount: {
            $sum: "$items.qty",
          },
        },
      },

      {
        $sort: {
          purchaseCount: -1,
        },
      },

      {
        $limit: limit,
      },
    ];

    const results = await Order.aggregate(pipeline);

    if (!results.length) return [];

    const books = await Book.find({
      _id: {
        $in: results.map((r) => r._id),
      },
    });

    const map = new Map();

    books.forEach((book) => {
      map.set(book._id.toString(), book);
    });

    return results
      .map((item) => ({
        book: map.get(item._id.toString()),
        purchaseCount: item.purchaseCount,
      }))
      .filter((item) => item.book);
  }

  /**
   * ------------------------------------------------------
   * Frequently bought with MULTIPLE books (Cart)
   * ------------------------------------------------------
   */
  async recommendMany(bookIds, limit = 10) {
    const ids = bookIds.map((id) => new mongoose.Types.ObjectId(id));

    const pipeline = [
      {
        $match: {
          status: {
            $in: ["processing", "shipped", "delivered"],
          },
        },
      },

      {
        $match: {
          "items.bookId": {
            $in: ids,
          },
        },
      },

      {
        $unwind: "$items",
      },

      // Ignore books already in cart
      {
        $match: {
          "items.bookId": {
            $nin: ids,
          },
        },
      },

      {
        $group: {
          _id: "$items.bookId",
          purchaseCount: {
            $sum: "$items.qty",
          },
        },
      },

      {
        $sort: {
          purchaseCount: -1,
        },
      },

      {
        $limit: limit,
      },
    ];

    const results = await Order.aggregate(pipeline);

    if (!results.length) return [];

    const books = await Book.find({
      _id: {
        $in: results.map((r) => r._id),
      },
    });

    const map = new Map();

    books.forEach((book) => {
      map.set(book._id.toString(), book);
    });

    return results
      .map((item) => ({
        book: map.get(item._id.toString()),
        purchaseCount: item.purchaseCount,
      }))
      .filter((item) => item.book);
  }
}

module.exports = new FrequentlyBoughtTogether();
