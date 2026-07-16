class HybridRecommendation {
  constructor() {
    this.weights = {
      semantic: 0.65,
      collaborative: 0.2,
      popularity: 0.1,
      profile: 0.05,
    };
  }

  merge({
    semantic = [],
    popularity = [],
    collaborative = [],
    profile = null,
  }) {
    const map = new Map();

    //-----------------------------------
    // Semantic
    //-----------------------------------

    semantic.forEach((item) => {
      const id = item.book._id.toString();

      map.set(id, {
        book: item.book,

        semanticScore: item.semanticScore || 0,

        collaborativeScore: 0,

        popularityScore: 0,

        profileScore: 0,

        finalScore: (item.semanticScore || 0) * this.weights.semantic,
      });
    });

    //-----------------------------------
    // Popularity
    //-----------------------------------

    popularity.forEach((item) => {
      const id = item.book._id.toString();

      if (!map.has(id)) return;

      const recommendation = map.get(id);

      recommendation.popularityScore = item.popularityScore;

      recommendation.finalScore +=
        item.popularityScore * this.weights.popularity;
    });

    //-----------------------------------
    // Collaborative
    //-----------------------------------

    collaborative.forEach((item) => {
      const id = item.book._id.toString();

      if (!map.has(id)) return;

      const recommendation = map.get(id);

      recommendation.collaborativeScore = item.collaborativeScore;

      recommendation.finalScore +=
        item.collaborativeScore * this.weights.collaborative;
    });

    //-----------------------------------
    // Profile Boost
    //-----------------------------------

    if (profile) {
      map.forEach((recommendation) => {
        let boost = 0;

        //--------------------------------
        // Categories
        //--------------------------------

        if (recommendation.book.categories && profile.favoriteCategories) {
          recommendation.book.categories.forEach((category) => {
            const match = profile.favoriteCategories.find(
              (c) => c.category === category,
            );

            if (match) {
              boost += match.score;
            }
          });
        }

        //--------------------------------
        // Authors
        //--------------------------------

        if (recommendation.book.authors && profile.favoriteAuthors) {
          recommendation.book.authors.forEach((author) => {
            const match = profile.favoriteAuthors.find(
              (a) => a.author === author,
            );

            if (match) {
              boost += match.score;
            }
          });
        }

        recommendation.profileScore = boost;

        recommendation.finalScore += boost * this.weights.profile;
      });
    }

    return [...map.values()].sort((a, b) => b.finalScore - a.finalScore);
  }
}

module.exports = new HybridRecommendation();
