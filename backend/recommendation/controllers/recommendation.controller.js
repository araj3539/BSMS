const recommendationService = require("../services/recommendation.service");
const semanticSearchService = require("../services/semanticSearch.service");
const interactionService = require("../services/interaction.service");

class RecommendationController {
  /**
   * AI Semantic Search
   * GET /api/recommendation/search?q=...
   */
  async search(req, res) {
    try {
      const { q, category, inStockOnly, limit } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Search query is required.",
        });
      }

      const books = await semanticSearchService.search(q, {
        category: category || null,
        inStockOnly: inStockOnly === "true",
        limit: Number(limit) || 20,
      });

      return res.status(200).json({
        success: true,
        total: books.length,
        books,
      });
    } catch (err) {
      console.error("[Semantic Search]", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
 * Track User Interaction
 * POST /api/recommendation/track
 */
async track(req, res) {
  try {
    const { bookId, action, metadata = {} } = req.body;

    if (!bookId || !action) {
      return res.status(400).json({
        success: false,
        message: "bookId and action are required.",
      });
    }

    await interactionService.log({
      userId: req.user.id,
      bookId,
      action,
      metadata,
    });

    return res.status(200).json({
      success: true,
      message: "Interaction recorded successfully.",
    });
  } catch (err) {
    console.error("[Track Interaction]", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

  /**
   * Book Recommendations
   * GET /api/recommendation/book/:bookId
   */
  async recommendBook(req, res) {
    try {
      const userId = req.user ? req.user.id : null;

      const recommendations = await recommendationService.recommendByBook(
        req.params.bookId,
        userId,
      );

      return res.status(200).json({
        success: true,
        total: recommendations.length,
        recommendations,
      });
    } catch (err) {
      console.error("[Recommendation]", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Popular Books
   * GET /api/recommendation/popular
   */
  async popular(req, res) {
    try {
      const books = await recommendationService.recommendPopular();

      return res.status(200).json({
        success: true,
        total: books.length,
        books,
      });
    } catch (err) {
      console.error("[Popular]", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Frequently Bought Together
   * GET /api/recommendation/book/:bookId/frequently-bought
   */
  async frequentlyBought(req, res) {
    try {
      const books =
        await recommendationService.recommendFrequentlyBoughtTogether(
          req.params.bookId,
        );

      return res.status(200).json({
        success: true,
        total: books.length,
        books,
      });
    } catch (err) {
      console.error("[Frequently Bought Together]", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Home Recommendations
   * GET /api/recommendation/home
   */
  async home(req, res) {
    try {
      const userId = req.user ? req.user.id : null;

      const result = await recommendationService.getHomeRecommendations(userId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error("[Home Recommendation]", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new RecommendationController();
