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

  merge({
    semantic = [],
    popularity = [],
    collaborative = [],
    profile = null,
  }) {
    const map = new Map();

    //------------------------------------
    // Semantic
    //------------------------------------

    semantic.forEach((item) => {
      const id = item.book._id.toString();

      const semanticScore = this.normalize(item.semanticScore || 0);

      map.set(id, {
        book: item.book,

        semanticScore,

        collaborativeScore: 0,

        popularityScore: 0,

        profileScore: 0,

        finalScore: semanticScore * this.weights.semantic,
      });
    });

    //------------------------------------
    // Popularity
    //------------------------------------

    popularity.forEach((item) => {
      const id = item.book._id.toString();

      if (!map.has(id)) return;

      const recommendation = map.get(id);

      const score = this.normalize(item.popularityScore || 0);

      recommendation.popularityScore = score;

      recommendation.finalScore += score * this.weights.popularity;
    });

    //------------------------------------
    // Collaborative
    //------------------------------------

    collaborative.forEach((item) => {
      const id = item.book._id.toString();

      if (!map.has(id)) return;

      const recommendation = map.get(id);

      const score = this.normalize(item.collaborativeScore || 0);

      recommendation.collaborativeScore = score;

      recommendation.finalScore += score * this.weights.collaborative;
    });

    //------------------------------------
    // Profile
    //------------------------------------

    if (profile) {
      map.forEach((recommendation) => {
        let boost = 0;

        //--------------------------------

        if (recommendation.book.categories && profile.favoriteCategories) {
          recommendation.book.categories.forEach((category) => {
            const match = profile.favoriteCategories.find(
              (c) => c.category === category,
            );

            if (match) boost += match.score;
          });
        }

        //--------------------------------

        if (recommendation.book.authors && profile.favoriteAuthors) {
          recommendation.book.authors.forEach((author) => {
            const match = profile.favoriteAuthors.find(
              (a) => a.author === author,
            );

            if (match) boost += match.score;
          });
        }

        const normalizedProfile = Math.min(boost / this.MAX_PROFILE_SCORE, 1);

        recommendation.profileScore = normalizedProfile;

        recommendation.finalScore += normalizedProfile * this.weights.profile;

        recommendation.finalScore = this.normalize(recommendation.finalScore);
      });
    }

    return [...map.values()].sort((a, b) => b.finalScore - a.finalScore);
  }
}

module.exports = new HybridRecommendation();
