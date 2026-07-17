const profileService = require("../services/profile.service");
const RecommendationCache = require("../models/RecommendationCache");

class ProfileWorker {
  async process(userId) {
    try {
      console.log(`[ProfileWorker] Updating profile ${userId}`);

      //----------------------------------
      // Rebuild Profile
      //----------------------------------

      await profileService.buildProfile(userId);

      //----------------------------------
      // Invalidate Recommendation Cache
      //----------------------------------

      await RecommendationCache.deleteMany({
        user: userId,
      });

      console.log(`[ProfileWorker] Completed ${userId}`);
    } catch (err) {
      console.error(
        "[ProfileWorker]",

        err.message,
      );
    }
  }
}

module.exports = new ProfileWorker();
