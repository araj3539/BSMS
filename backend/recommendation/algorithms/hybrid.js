class HybridRecommendation {
  constructor() {
    this.MAX_PROFILE_SCORE = 100;
  }

  getWeights(profile) {
    if (!profile) {
      return {
        semantic: 0.55,
        collaborative: 0,
        popularity: 0.35,
        profile: 0.1,
      };
    }

    const interactionCount = profile.totalInteractions || 0;

    if (interactionCount < 20) {
      return {
        semantic: 0.55,
        collaborative: 0.1,
        popularity: 0.25,
        profile: 0.1,
      };
    }

    if (interactionCount < 100) {
      return {
        semantic: 0.5,
        collaborative: 0.25,
        popularity: 0.15,
        profile: 0.1,
      };
    }

    return {
      semantic: 0.45,
      collaborative: 0.35,
      popularity: 0.1,
      profile: 0.1,
    };
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

  calculateFinalScore(recommendation, profile) {
    let total = 0;

    const weights = this.getWeights(profile);

    for (const algorithm in weights) {
      total += (recommendation.scores[algorithm] || 0) * weights[algorithm];
    }

    return this.normalize(total);
  }

  calculateScores(map, profile) {
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

    this.calculateScores(map, profile);

    return [...map.values()].sort((a, b) => b.finalScore - a.finalScore);
  }
}

module.exports = new HybridRecommendation();
