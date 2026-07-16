const Book = require("../../models/Book");

class PopularityRecommendation {
  /**
   * Recommend popular books
   */
  async recommend(options = {}) {
    const { limit = 20 } = options;

    const books = await Book.find()

      .sort({
        soldCount: -1,

        rating: -1,

        numReviews: -1,

        createdAt: -1,
      })

      .limit(limit);

    return books.map((book, index) => {
      return {
        book,

        popularityScore: (limit - index) / limit,
      };
    });
  }
}

module.exports = new PopularityRecommendation();
