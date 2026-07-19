class HybridRecommendation {
  constructor() {
    this.weights = {
      semantic: 0.65,
      collaborative: 0.2,
      popularity: 0.1,
      profile: 0.05,
    };

    this.MAX_PROFILE_SCORE = 100;
  }

  normalize(score) {
    if (score == null || Number.isNaN(score)) return 0;

    return Math.max(0, Math.min(score, 1));
  }

  createCandidate(book) {
    return {
      book,

      // Generic score container
      scores: {},

      // Backward compatibility
      semanticScore: 0,
      collaborativeScore: 0,
      popularityScore: 0,
      profileScore: 0,

      finalScore: 0,
    };
  }

  mergeAlgorithm({ map, recommendations = [], scoreField }) {
    recommendations.forEach((item) => {
      if (!item?.book) return;

      const id = item.book._id.toString();

      let recommendation;

      if (map.has(id)) {
        recommendation = map.get(id);
      } else {
        recommendation = this.createCandidate(item.book);
        map.set(id, recommendation);
      }

      const score = this.normalize(
        item[`${scoreField}Score`] ?? item[scoreField] ?? 0,
      );

      // Generic storage
      recommendation.scores[scoreField] = score;

      // Legacy fields (for existing code)
      recommendation[`${scoreField}Score`] = score;
    });
  }

  calculateProfileScore(book, profile) {
    if (!profile) return 0;

    let boost = 0;

    // Category affinity
    if (book.categories?.length && profile.favoriteCategories?.length) {
      for (const category of book.categories) {
        const match = profile.favoriteCategories.find(
          (c) => c.category === category,
        );

        if (match) {
          boost += match.score;
        }
      }
    }

    // Author affinity
    if (book.authors?.length && profile.favoriteAuthors?.length) {
      for (const author of book.authors) {
        const match = profile.favoriteAuthors.find((a) => a.author === author);

        if (match) {
          boost += match.score;
        }
      }
    }

    return this.normalize(boost / this.MAX_PROFILE_SCORE);
  }

  applyProfileBoost(map, profile) {
    if (!profile) return;

    map.forEach((recommendation) => {
      const profileScore = this.calculateProfileScore(
        recommendation.book,
        profile,
      );

      recommendation.scores.profile = profileScore;

      // Backward compatibility
      recommendation.profileScore = profileScore;
    });
  }

  calculateFinalScore(recommendation) {
    let total = 0;

    for (const algorithm in this.weights) {
      const score = recommendation.scores[algorithm] || 0;

      total += score * this.weights[algorithm];
    }

    return this.normalize(total);
  }

  calculateScores(map) {
    map.forEach((recommendation) => {
      recommendation.finalScore = this.calculateFinalScore(recommendation);
    });
  }

  merge({
    semantic = [],
    collaborative = [],
    popularity = [],
    profile = null,
  }) {
    const map = new Map();

    this.mergeAlgorithm({
      map,
      recommendations: semantic,
      scoreField: "semantic",
    });

    this.mergeAlgorithm({
      map,
      recommendations: collaborative,
      scoreField: "collaborative",
    });

    this.mergeAlgorithm({
      map,
      recommendations: popularity,
      scoreField: "popularity",
    });

    this.applyProfileBoost(map, profile);

    this.calculateScores(map);

    return [...map.values()].sort((a, b) => b.finalScore - a.finalScore);
  }
}

module.exports = new HybridRecommendation();
