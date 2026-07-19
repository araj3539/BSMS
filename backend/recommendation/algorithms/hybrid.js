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
    if (Number.isNaN(score)) return 0;

    return Math.max(0, Math.min(score, 1));
  }

  createCandidate(book) {
    return {
      book,

      semanticScore: 0,
      collaborativeScore: 0,
      popularityScore: 0,
      profileScore: 0,

      finalScore: 0,
    };
  }

  mergeAlgorithm({ map, recommendations = [], scoreField }) {
    recommendations.forEach((item) => {
      if (!item.book) return;

      const id = item.book._id.toString();

      let recommendation;

      if (map.has(id)) {
        recommendation = map.get(id);
      } else {
        recommendation = this.createCandidate(item.book);
        map.set(id, recommendation);
      }

      recommendation[scoreField] = this.normalize(item[scoreField] || 0);
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

    return Math.min(boost / this.MAX_PROFILE_SCORE, 1);
  }

  applyProfileBoost(map, profile) {
    if (!profile) return;

    map.forEach((recommendation) => {
      const profileScore = this.calculateProfileScore(
        recommendation.book,
        profile,
      );

      recommendation.profileScore = profileScore;
    });
  }

  calculateFinalScore(recommendation) {
    const score =
      recommendation.semanticScore * this.weights.semantic +
      recommendation.collaborativeScore * this.weights.collaborative +
      recommendation.popularityScore * this.weights.popularity +
      recommendation.profileScore * this.weights.profile;

    return this.normalize(score);
  }

  calculateScores(map) {
    map.forEach((recommendation) => {
      recommendation.finalScore = this.calculateFinalScore(recommendation);
    });
  }

  merge({
    semantic = [],
    popularity = [],
    collaborative = [],
    profile = null,
  }) {
    const map = new Map();

    this.mergeAlgorithm({
      map,
      recommendations: semantic,
      scoreField: "semanticScore",
      weight: this.weights.semantic,
    });

    //------------------------------------
    // Popularity
    //------------------------------------

    this.mergeAlgorithm({
      map,
      recommendations: popularity,
      scoreField: "popularityScore",
      weight: this.weights.popularity,
    });

    //------------------------------------
    // Collaborative
    //------------------------------------

    this.mergeAlgorithm({
      map,
      recommendations: collaborative,
      scoreField: "collaborativeScore",
      weight: this.weights.collaborative,
    });

    this.applyProfileBoost(map, profile);

    this.calculateScores(map);

    return [...map.values()].sort((a, b) => b.finalScore - a.finalScore);
  }
}

module.exports = new HybridRecommendation();
