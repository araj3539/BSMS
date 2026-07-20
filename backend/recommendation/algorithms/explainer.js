class RecommendationExplainer {
  explain(item, profile = null) {
    const reasons = [];

    // ----------------------------------
    // Profile-Based Reasons
    // ----------------------------------

    if (profile) {
      // Author Match
      if (
        item.book?.authors?.length &&
        profile.favoriteAuthors?.length
      ) {
        const matchedAuthor = item.book.authors.find((author) =>
          profile.favoriteAuthors.some(
            (fav) => fav.author === author
          )
        );

        if (matchedAuthor) {
          reasons.push(`Because you enjoy books by ${matchedAuthor}`);
        }
      }

      // Category Match
      if (
        item.book?.categories?.length &&
        profile.favoriteCategories?.length
      ) {
        const matchedCategory = item.book.categories.find((category) =>
          profile.favoriteCategories.some(
            (fav) => fav.category === category
          )
        );

        if (matchedCategory) {
          reasons.push(`Matches your interest in ${matchedCategory}`);
        }
      }

      // Recent Interest Match
      if (
        item.book?.categories?.length &&
        profile.recentInterests?.length
      ) {
        const recentCategory = item.book.categories.find((category) =>
          profile.recentInterests.some(
            (recent) => recent.category === category
          )
        );

        if (recentCategory) {
          reasons.push(
            `Based on your recent interest in ${recentCategory}`
          );
        }
      }

      // Preferred Format
      if (profile.favoriteFormats?.length) {
        let bookFormat = null;

        if (item.book.ebookUrl) {
          bookFormat = "ebook";
        } else if (item.book.audiobookUrl) {
          bookFormat = "audiobook";
        } else {
          bookFormat = "paperback";
        }

        const prefersFormat = profile.favoriteFormats.some(
          (fav) => fav.format === bookFormat
        );

        if (prefersFormat) {
          reasons.push(`Available in your preferred ${bookFormat} format`);
        }
      }

      // Price Match
      if (
        profile.averagePrice &&
        item.book.price
      ) {
        const difference = Math.abs(
          item.book.price - profile.averagePrice
        );

        if (difference <= profile.averagePrice * 0.20) {
          reasons.push("Matches your usual price range");
        }
      }
    }

    // ----------------------------------
    // Recommendation Engine Reasons
    // ----------------------------------

    if (item.semanticScore > 0.70) {
      reasons.push("Similar to the selected book");
    }

    if (item.collaborativeScore > 0) {
      reasons.push(
        "Popular among readers with similar interests"
      );
    }

    if (item.popularityScore > 0.60) {
      reasons.push("Trending among readers");
    }

    // ----------------------------------
    // Book Quality Reasons
    // ----------------------------------

    if (
      item.book.rating >= 4.5 &&
      item.book.numReviews >= 50
    ) {
      reasons.push("Highly rated by readers");
    }

    if (
      item.book.stock > 0 &&
      item.book.stock <= 5
    ) {
      reasons.push("Limited stock available");
    }

    // ----------------------------------
    // Remove Duplicate Reasons
    // ----------------------------------

    const uniqueReasons = [...new Set(reasons)];

    // ----------------------------------
    // Fallback
    // ----------------------------------

    if (uniqueReasons.length === 0) {
      uniqueReasons.push("Recommended for you");
    }

    return uniqueReasons;
  }

  explainAll(recommendations, profile = null) {
    return recommendations.map((item) => ({
      ...item,
      reasons: this.explain(item, profile),
    }));
  }
}

module.exports = new RecommendationExplainer();