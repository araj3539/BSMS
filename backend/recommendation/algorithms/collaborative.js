const mongoose = require("mongoose");
const UserInteraction = require("../models/UserInteraction");
const Book = require("../../models/Book");

const ObjectId = mongoose.Types.ObjectId;

const ACTION_WEIGHTS = {
  VIEW: 1,
  SEARCH: 1,
  CLICK: 2,
  ADD_CART: 4,
  REMOVE_CART: -1,
  WISHLIST: 3,
  REMOVE_WISHLIST: -1,
  PURCHASE: 8,
  RATE: 5,
  REVIEW: 6,
  READ: 4,
  LISTEN: 4,
  DOWNLOAD: 5,
};

class CollaborativeRecommendation {
  async recommend(userId, options = {}) {
    const { limit = 20 } = options;

    //------------------------------------------
    // Step 1 : Current User History
    //------------------------------------------

    const myInteractions = await UserInteraction.find({
      user: userId,
    }).lean();

    if (!myInteractions.length) return [];

    const myBooks = [...new Set(myInteractions.map((i) => i.book.toString()))];

    //------------------------------------------
    // Step 2 : Find Similar Users
    //------------------------------------------

    const similarUsers = await UserInteraction.aggregate([
      {
        $match: {
          book: {
            $in: myBooks.map((id) => new ObjectId(id)),
          },

          user: {
            $ne: new ObjectId(userId),
          },
        },
      },

      {
        $group: {
          _id: "$user",

          overlap: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          overlap: -1,
        },
      },

      {
        $limit: 50,
      },
    ]);

    if (!similarUsers.length) return [];

    //------------------------------------------
    // Step 3 : Load Similar Users'
    // Interactions
    //------------------------------------------

    const similarUserIds = similarUsers.map((u) => u._id);

    const interactions = await UserInteraction.find({
      user: {
        $in: similarUserIds,
      },
    }).lean();

    //------------------------------------------
    // Step 4 : Score Books
    //------------------------------------------

    const scoreMap = new Map();

    for (const interaction of interactions) {
      const id = interaction.book.toString();

      if (myBooks.includes(id)) continue;

      const weight = ACTION_WEIGHTS[interaction.action] || 1;

      scoreMap.set(
        id,

        (scoreMap.get(id) || 0) + weight,
      );
    }

    //------------------------------------------
    // Step 5 : Top Ranked Books
    //------------------------------------------

    const ranked = [...scoreMap.entries()]

      .sort((a, b) => b[1] - a[1])

      .slice(0, limit);

    if (!ranked.length) return [];

    //------------------------------------------
    // Step 6 : Load Books
    //------------------------------------------

    const ids = ranked.map((r) => new ObjectId(r[0]));

    const books = await Book.find({
      _id: {
        $in: ids,
      },
    }).lean();

    const bookMap = new Map();

    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    //------------------------------------------
    // Step 7 : Normalize Score
    //------------------------------------------

    const maxScore = ranked[0][1];

    return ranked

      .map(([id, score]) => {
        const book = bookMap.get(id);

        if (!book) return null;

        return {
          book,

          collaborativeScore: maxScore ? score / maxScore : 0,
        };
      })

      .filter(Boolean);
  }
}

module.exports = new CollaborativeRecommendation();
