class ReRanker {
  constructor() {
    // ------------------------------
    // Penalties
    // ------------------------------
    this.authorPenalty = 0.15;
    this.categoryPenalty = 0.05;
    this.lowStockPenalty = 0.1;

    // ------------------------------
    // Bonuses
    // ------------------------------
    this.highRatedBonus = 0.05;
    this.newBookBonus = 0.05;
    this.highStockBonus = 0.03;
    this.bestSellerBonus = 0.03;

    // ------------------------------
    // Semantic Confidence
    // ------------------------------
    this.confidenceBonus = {
      "Very High": 0.03,
      High: 0.02,
      Medium: 0.01,
      Low: 0,
    };
  }

  rerank(recommendations = []) {
    if (!recommendations.length) return [];

    //-----------------------------------------
    // Count repeated authors & categories
    //-----------------------------------------

    const authorCount = {};
    const categoryCount = {};

    recommendations.forEach((item) => {
      const authors =
        item.book.authors || (item.book.author ? [item.book.author] : []);

      authors.forEach((author) => {
        if (!author) return;

        authorCount[author] = (authorCount[author] || 0) + 1;
      });

      (item.book.categories || []).forEach((category) => {
        if (!category) return;

        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });

    //-----------------------------------------
    // Re-ranking
    //-----------------------------------------

    recommendations.forEach((item) => {
      let score = item.finalScore || 0;

      //-------------------------------------
      // Author Diversity
      //-------------------------------------

      const authors =
        item.book.authors || (item.book.author ? [item.book.author] : []);

      const repeatedAuthor = authors.some((author) => authorCount[author] > 2);

      if (repeatedAuthor) {
        score -= this.authorPenalty;
      }

      //-------------------------------------
      // Category Diversity
      //-------------------------------------

      const repeatedCategory = (item.book.categories || []).some(
        (category) => categoryCount[category] > 5,
      );

      if (repeatedCategory) {
        score -= this.categoryPenalty;
      }

      //-------------------------------------
      // Out of Stock
      //-------------------------------------

      if ((item.book.stock || 0) <= 0) {
        score = -1;
      }

      //-------------------------------------
      // Low Stock
      //-------------------------------------
      else if (item.book.stock <= 2) {
        score -= this.lowStockPenalty;
      }

      //-------------------------------------
      // High Stock
      //-------------------------------------
      else if (item.book.stock >= 20) {
        score += this.highStockBonus;
      }

      //-------------------------------------
      // Highly Rated
      //-------------------------------------

      const rating = item.book.averageRating ?? item.book.rating ?? 0;

      const totalRatings = item.book.totalRatings ?? item.book.numReviews ?? 0;

      if (rating >= 4.5 && totalRatings >= 50) {
        score += this.highRatedBonus;
      }

      //-------------------------------------
      // Bestseller
      //-------------------------------------

      const sales = item.book.totalSales ?? item.book.soldCount ?? 0;

      if (sales >= 1000) {
        score += this.bestSellerBonus;
      }

      //-------------------------------------
      // New Arrival
      //-------------------------------------

      if (item.book.createdAt) {
        const age = Date.now() - new Date(item.book.createdAt).getTime();

        const days = age / (1000 * 60 * 60 * 24);

        if (days <= 30) {
          score += this.newBookBonus;
        }
      }

      //-------------------------------------
      // Semantic Confidence
      //-------------------------------------

      if (item.confidence) {
        score += this.confidenceBonus[item.confidence] || 0;
      }

      //-------------------------------------
      // Clamp Score
      //-------------------------------------

      item.finalScore = Math.max(0, Math.min(score, 1));
    });

    //-----------------------------------------
    // Remove Invalid + Sort
    //-----------------------------------------

    return recommendations
      .filter((item) => item.finalScore > 0)
      .sort((a, b) => b.finalScore - a.finalScore);
  }
}

module.exports = new ReRanker();
