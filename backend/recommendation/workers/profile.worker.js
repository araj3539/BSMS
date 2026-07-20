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

      try {
        await RecommendationCache.deleteMany({
          user: userId,
        });
      } catch (err) {
        console.error("[ProfileWorker] Cache invalidation failed", err);
      }

      console.log(`[ProfileWorker] Completed ${userId}`);
      return true;
    } catch (err) {
      console.error("[ProfileWorker]", err);
      return false;
    }
  }
}

module.exports = new ProfileWorker();
