const UserInteraction = require("../models/UserInteraction");
const profileWorker = require("../workers/profile.worker");

class InteractionService {
  /**
   * Record an interaction
   */
  async log({ userId, bookId, action, metadata = {} }) {
    if (!userId) return null;

    if (action !== "SEARCH" && !bookId) {
      return null;
    }

    if (action === "VIEW") {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const existing = await UserInteraction.findOne({
        user: userId,
        book: bookId,
        action: "VIEW",
        createdAt: { $gte: fiveMinutesAgo },
      });

      if (existing) {
        return existing;
      }
    }

    const interaction = await UserInteraction.create({
      user: userId,
      book: bookId || null,
      action,
      metadata,
    });

    // Run profile update in background
    profileWorker.process(userId).catch((err) => {
      console.error("[ProfileWorker]", err);
    });

    return interaction;
  }

  /**
   * Get all interactions of user
   */
  async getUserInteractions(userId) {
    return UserInteraction.find({
      user: userId,
    })
      .populate("book")
      .sort("-createdAt");
  }

  /**
   * Get interactions of one book
   */
  async getBookInteractions(bookId) {
    return UserInteraction.find({
      book: bookId,
    });
  }

  /**
   * Count actions
   */
  async count(bookId, action) {
    return UserInteraction.countDocuments({
      book: bookId,
      action,
    });
  }
}

module.exports = new InteractionService();
