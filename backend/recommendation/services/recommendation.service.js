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

const Order = require("../../models/Order");

class RecommendationService {
  constructor() {
    this.CACHE_DURATION = 24 * 60 * 60 * 1000;

    this.ALGORITHM_VERSION = 1;
  }

  async getSemanticRecommendations(bookId) {
    return semantic.recommend(bookId);
  }

  async getPopularityRecommendations() {
    return popularity.recommend();
  }

  async getCollaborativeRecommendations(userId) {
    if (!userId) return [];

    return collaborative.recommend(userId);
  }

  async getUserProfile(userId) {
    if (!userId) return null;

    return profileService.getProfile(userId);
  }

  getResult(result, name) {
    if (result.status === "fulfilled") {
      return result.value;
    }

    console.error(
      `[Recommendation] ${name}:`,
      result.reason?.message || result.reason,
    );

    return [];
  }

  getProfileResult(result) {
    if (result.status === "fulfilled") {
      return result.value;
    }

    console.error(
      "[Recommendation] Profile:",
      result.reason?.message || result.reason,
    );

    return null;
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
      this.getSemanticRecommendations(bookId),
      this.getPopularityRecommendations(),
      this.getCollaborativeRecommendations(userId),
      this.getUserProfile(userId),
    ];

    const [
      semanticResult,
      popularityResult,
      collaborativeResult,
      profileResult,
    ] = await Promise.allSettled(tasks);

    const semanticResults = this.getResult(semanticResult, "Semantic");

    const popularityResults = this.getResult(popularityResult, "Popularity");

    const collaborativeResults = this.getResult(
      collaborativeResult,
      "Collaborative",
    );

    const profile = this.getProfileResult(profileResult);
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

    const explained = explainer.explainAll(reranked, profile);

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
        // Get all purchased books
        const orders = await Order.find({
          userId,
          paymentStatus: "paid",
          status: {
            $ne: "cancelled",
          },
        }).select("items");

        const ownedBookIds = new Set();

        orders.forEach((order) => {
          order.items.forEach((item) => {
            if (item.bookId) {
              ownedBookIds.add(item.bookId.toString());
            }
          });
        });

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

        const filtered = merged.filter(
          (item) => !ownedBookIds.has(item.book._id.toString()),
        );

        const reranked = reranker.rerank(filtered);

        recommended = explainer.explainAll(reranked, profile).slice(0, 10);
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
