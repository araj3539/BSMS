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

    this.ALGORITHM_VERSION = 1;
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

      algorithmVersion: this.ALGORITHM_VERSION,

      expiresAt: {
        $gt: new Date(),
      },
    }).populate("recommendations.book");

    if (cached) {
      console.log("Recommendation Cache HIT");

      return cached.recommendations;
    }

    console.log("Recommendation Cache MISS");

    //--------------------------------------------------
    // 2. Generate Recommendations (Parallel)
    //--------------------------------------------------

    const tasks = [
      semantic.recommend(bookId),
      popularity.recommend(),
      userId ? collaborative.recommend(userId) : Promise.resolve([]),
      userId ? profileService.getProfile(userId) : Promise.resolve(null),
    ];

    const [
      semanticResult,
      popularityResult,
      collaborativeResult,
      profileResult,
    ] = await Promise.allSettled(tasks);

    const semanticResults =
      semanticResult.status === "fulfilled" ? semanticResult.value : [];

    if (semanticResult.status === "rejected") {
      console.error(
        "[Recommendation] Semantic:",
        semanticResult.reason?.message || semanticResult.reason,
      );
    }

    const popularityResults =
      popularityResult.status === "fulfilled" ? popularityResult.value : [];

    if (popularityResult.status === "rejected") {
      console.error(
        "[Recommendation] Popularity:",
        popularityResult.reason.message,
      );
    }

    const collaborativeResults =
      collaborativeResult.status === "fulfilled"
        ? collaborativeResult.value
        : [];

    if (collaborativeResult.status === "rejected") {
      console.error(
        "[Recommendation] Collaborative:",
        collaborativeResult.reason.message,
      );
    }

    const profile =
      profileResult.status === "fulfilled" ? profileResult.value : null;

    if (profileResult.status === "rejected") {
      console.error("[Recommendation] Profile:", profileResult.reason.message);
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
    try {
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

          algorithmVersion: this.ALGORITHM_VERSION,

          expiresAt: new Date(Date.now() + this.CACHE_DURATION),
        },

        {
          upsert: true,

          new: true,
        },
      );
    } catch (err) {
      console.error("[Recommendation] Cache:", err.message);
    }
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
    let popular = [];
    let recommended = [];
    let trending = [];
    let newArrivals = [];

    //--------------------------------------------------
    // Popular Books
    //--------------------------------------------------

    try {
      popular = await popularity.recommend({
        limit: 10,
      });
    } catch (err) {
      console.error("[Home] Popular:", err.message);
    }

    //--------------------------------------------------
    // Personalized Recommendations
    //--------------------------------------------------

    if (userId) {
      try {
        const [profile, collaborativeResults, popularityResults] =
          await Promise.all([
            profileService.getProfile(userId),

            collaborative.recommend(userId),

            popularity.recommend({
              limit: 20,
            }),
          ]);

        const merged = hybrid.merge({
          semantic: [],

          collaborative: collaborativeResults,

          popularity: popularityResults,

          profile,
        });

        const reranked = reranker.rerank(merged);

        recommended = explainer.explainAll(reranked).slice(0, 10);
      } catch (err) {
        console.error("[Home] Personalized:", err.message);
      }
    }

    //--------------------------------------------------
    // New Arrivals
    //--------------------------------------------------

    try {
      newArrivals = await Book.find()
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean();
    } catch (err) {
      console.error("[Home] New Arrivals:", err.message);
    }

    //--------------------------------------------------
    // Trending
    //--------------------------------------------------

    try {
      trending = await Book.find()
        .sort({
          soldCount: -1,
          rating: -1,
        })
        .limit(10)
        .lean();
    } catch (err) {
      console.error("[Home] Trending:", err.message);
    }

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
