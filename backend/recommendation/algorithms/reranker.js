class ReRanker {
  constructor() {
    this.authorPenalty = 0.15;
    this.lowStockPenalty = 0.1;
    this.highRatedBonus = 0.05;
    this.newBookBonus = 0.05;
  }

  rerank(recommendations) {
    const authorCount = {};

    recommendations.forEach((item) => {
      const author = item.book.author || "";

      authorCount[author] = (authorCount[author] || 0) + 1;
    });

    recommendations.forEach((item) => {
      let score = item.finalScore;

      //--------------------------------------------------
      // Diversity
      //--------------------------------------------------

      if (authorCount[item.book.author] > 2) {
        score -= this.authorPenalty;
      }

      //--------------------------------------------------
      // Low Stock
      //--------------------------------------------------

      if (item.book.stock <= 2 && item.book.stock > 0) {
        score -= this.lowStockPenalty;
      }

      //--------------------------------------------------
      // Out of Stock
      //--------------------------------------------------

      if (item.book.stock <= 0) {
        score = -1;
      }

      //--------------------------------------------------
      // Highly Rated
      //--------------------------------------------------

      if (item.book.rating >= 4.5 && item.book.numReviews >= 50) {
        score += this.highRatedBonus;
      }

      //--------------------------------------------------
      // Newly Added
      //--------------------------------------------------

      const age = Date.now() - new Date(item.book.createdAt).getTime();

      const days = age / (1000 * 60 * 60 * 24);

      if (days <= 30) {
        score += this.newBookBonus;
      }

      item.finalScore = score;
    });

    return recommendations

      .filter((item) => item.finalScore >= 0)

      .sort((a, b) => b.finalScore - a.finalScore);
  }
}

module.exports = new ReRanker();
