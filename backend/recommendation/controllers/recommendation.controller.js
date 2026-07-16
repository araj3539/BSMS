const recommendationService = require("../services/recommendation.service");

class RecommendationController {
  async recommendBook(req, res) {
    try {
      const userId = req.user ? req.user.id : null;

      const result = await recommendationService.recommendByBook(
        req.params.bookId,
        userId,
      );

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: err.message,
      });
    }
  }

  async search(req, res) {
    try {
      const result = await recommendationService.recommendByText(req.query.q);

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: err.message,
      });
    }
  }

  async popular(req, res) {
    try {
      const result = await recommendationService.recommendPopular();

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: err.message,
      });
    }
  }

  async frequentlyBought(req, res) {
    try {
      const result =
        await recommendationService.recommendFrequentlyBoughtTogether(
          req.params.bookId,
        );

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: err.message,
      });
    }
  }

  async home(req, res) {
    try {
      const userId = req.user ? req.user.id : null;

      const result = await recommendationService.getHomeRecommendations(userId);

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: err.message,
      });
    }
  }
}

module.exports = new RecommendationController();
