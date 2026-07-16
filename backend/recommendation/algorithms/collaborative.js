const UserInteraction = require("../models/UserInteraction");
const Book = require("../../models/Book");

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
  /**
   * Generate collaborative recommendations
   */
  async recommend(userId, options = {}) {
    const { limit = 20 } = options;

    //---------------------------------------------------
    // Step 1 : User history
    //---------------------------------------------------

    const myInteractions = await UserInteraction.find({
      user: userId,
    }).lean();

    if (!myInteractions.length) return [];

    const myBooks = [...new Set(myInteractions.map((i) => i.book.toString()))];

    //---------------------------------------------------
    // Step 2 : Find similar users
    //---------------------------------------------------

    const similarUsers = await UserInteraction.aggregate([
      {
        $match: {
          book: {
            $in: myBooks.map((id) =>
              Book.db.base.Types.ObjectId.createFromHexString(id),
            ),
          },
          user: {
            $ne: Book.db.base.Types.ObjectId.createFromHexString(
              userId.toString(),
            ),
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

    //---------------------------------------------------
    // Step 3 : Candidate books
    //---------------------------------------------------

    const similarUserIds = similarUsers.map((u) => u._id);

    const interactions = await UserInteraction.find({
      user: {
        $in: similarUserIds,
      },
    }).lean();

    //---------------------------------------------------
    // Step 4 : Score books
    //---------------------------------------------------

    const scoreMap = new Map();

    interactions.forEach((interaction) => {
      const bookId = interaction.book.toString();

      if (myBooks.includes(bookId)) return;

      const weight = ACTION_WEIGHTS[interaction.action] || 1;

      if (!scoreMap.has(bookId)) {
        scoreMap.set(bookId, 0);
      }

      scoreMap.set(
        bookId,

        scoreMap.get(bookId) + weight,
      );
    });

    //---------------------------------------------------
    // Step 5 : Load books
    //---------------------------------------------------

    const ranked = [...scoreMap.entries()]

      .sort((a, b) => b[1] - a[1])

      .slice(0, limit);

    const ids = ranked.map((r) => r[0]);

    const books = await Book.find({
      _id: {
        $in: ids,
      },
    });

    const bookMap = new Map();

    books.forEach((book) => {
      bookMap.set(
        book._id.toString(),

        book,
      );
    });

    //---------------------------------------------------
    // Step 6 : Return
    //---------------------------------------------------

    return ranked

      .map(([id, score]) => {
        const book = bookMap.get(id);

        if (!book) return null;

        return {
          book,

          collaborativeScore: score,
        };
      })

      .filter(Boolean);
  }
}

module.exports = new CollaborativeRecommendation();
