const RecommendationCache = require("../models/RecommendationCache");
const Book = require("../../models/Book");


const semantic = require("../algorithms/semantic");
const popularity = require("../algorithms/popularity");
const collaborative = require("../algorithms/collaborative");
const hybrid = require("../algorithms/hybrid");
const reranker = require("../algorithms/reranker");
const explainer = require("../algorithms/explainer");
const frequentlyBoughtTogether = require("../algorithms/frequentlyBoughtTogether");
const profileService = require("./profile.service");

class RecommendationService {
  constructor() {
    this.CACHE_DURATION = 24 * 60 * 60 * 1000;
  }

  /**
   * Book Recommendation
   */
  async recommendByBook(bookId, userId = null) {
    //--------------------------------------------------
    // 1. Check Cache
    //--------------------------------------------------

    const cached = await RecommendationCache.findOne({
      user: userId,

      sourceBook: bookId,

      expiresAt: {
        $gt: new Date(),
      },
    })

      .populate("recommendations.book");

    if (cached) {
      console.log("Recommendation Cache HIT");

      return cached.recommendations;
    }

    console.log("Recommendation Cache MISS");

    //--------------------------------------------------
    // 2. Generate Recommendations
    //--------------------------------------------------

    const semanticResults = await semantic.recommend(bookId);

    const popularityResults = await popularity.recommend();

    let collaborativeResults = [];

    if (userId) {
      collaborativeResults = await collaborative.recommend(userId);
    }

    let profile = null;

    if (userId) {
      profile = await profileService.getProfile(userId);
    }
    //--------------------------------------------------
    // 3. Hybrid Merge
    //--------------------------------------------------

    const merged = hybrid.merge({
      semantic: semanticResults,

      popularity: popularityResults,

      collaborative: collaborativeResults,

      profile,
    });

    //--------------------------------------------------
    // 4. Business Rules
    //--------------------------------------------------

    const reranked = reranker.rerank(merged);

    //--------------------------------------------------
    // 5. Explanation
    //--------------------------------------------------

    const explained = explainer.explainAll(reranked);

    //--------------------------------------------------
    // 6. Save Cache
    //--------------------------------------------------

    await RecommendationCache.findOneAndUpdate(
      {
        user: userId,

        sourceBook: bookId,
      },

      {
        user: userId,

        sourceBook: bookId,

        recommendations: explained.map((item) => ({
          book: item.book._id,

          semanticScore: item.semanticScore,

          collaborativeScore: item.collaborativeScore,

          popularityScore: item.popularityScore,

          finalScore: item.finalScore,

          reasons: item.reasons,
        })),

        algorithmVersion: 1,

        expiresAt: new Date(Date.now() + this.CACHE_DURATION),
      },

      {
        upsert: true,

        new: true,
      },
    );

    return explained;
  }

  /**
   * Popular Books
   */
  async recommendPopular() {
    return popularity.recommend();
  }

  async recommendFrequentlyBoughtTogether(bookId) {
    return frequentlyBoughtTogether.recommend(bookId);
  }

  async getHomeRecommendations(userId = null) {
    const popular = await popularity.recommend({ limit: 10 });

    let recommended = [];

    if (userId) {
      const profile = await profileService.getProfile(userId);

      if (profile && profile.favoriteCategories.length > 0) {
        const favouriteCategory = profile.favoriteCategories[0].category;

        recommended = await popularity.recommend({
          limit: 10,
        });

        recommended = recommended.filter((item) =>
          item.book.categories?.includes(favouriteCategory),
        );
      }
    }

    const newArrivals = await Book.find().sort({ createdAt: -1 }).limit(10);

    const trending = await Book.find()
      .sort({
        soldCount: -1,
        rating: -1,
      })
      .limit(10);

    return {
      continueReading: [],

      recommendedForYou: recommended,

      trending,

      popular,

      newArrivals,
    };
  }
}

module.exports = new RecommendationService();
