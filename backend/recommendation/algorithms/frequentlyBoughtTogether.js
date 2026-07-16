const UserInteraction = require("../models/UserInteraction");
const Book = require("../../models/Book");
const mongoose = require("mongoose");

class FrequentlyBoughtTogether {
  async recommend(bookId, limit = 10) {
    //----------------------------------------------------
    // Users who purchased this book
    //----------------------------------------------------

    const purchasers = await UserInteraction.distinct("user", {
      book: bookId,

      action: "PURCHASE",
    });

    if (!purchasers.length) return [];

    //----------------------------------------------------
    // Other purchases
    //----------------------------------------------------

    const pipeline = [
      {
        $match: {
          user: {
            $in: purchasers,
          },

          action: "PURCHASE",

          book: {
            $ne: new mongoose.Types.ObjectId(bookId),
          },
        },
      },

      {
        $group: {
          _id: "$book",

          purchaseCount: {
            $sum: 1,
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

    const results = await UserInteraction.aggregate(pipeline);

    const books = await Book.find({
      _id: {
        $in: results.map((r) => r._id),
      },
    });

    const map = new Map();

    books.forEach((book) => {
      map.set(
        book._id.toString(),

        book,
      );
    });

    return results.map((result) => ({
      book: map.get(result._id.toString()),

      purchaseCount: result.purchaseCount,
    }));
  }
}

module.exports = new FrequentlyBoughtTogether();
