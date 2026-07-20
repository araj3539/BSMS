const UserInteraction = require("../models/UserInteraction");
const UserPreference = require("../models/UserPreference");
const Book = require("../../models/Book");

const ACTION_WEIGHTS = {
  VIEW: 1,
  SEARCH: 1,
  CLICK: 2,
  ADD_CART: 4,
  REMOVE_CART: -2,
  WISHLIST: 5,
  REMOVE_WISHLIST: -3,
  PURCHASE: 10,
  RATE: 6,
  REVIEW: 7,
  READ: 4,
  LISTEN: 4,
  DOWNLOAD: 5,
};

class ProfileService {
  async buildProfile(userId) {
    const interactions = await UserInteraction.find({ user: userId }).populate(
      "book",
    );

    if (!interactions.length) return null;

    const categoryScores = {};
    const authorScores = {};
    const formatScores = {};
    const recentCategoryScores = {};

    let weightedPrice = 0;
    let totalWeight = 0;

    for (const interaction of interactions) {
      const book = interaction.book;

      if (!book) continue;

      let weight = ACTION_WEIGHTS[interaction.action] || 1;

      // -------------------------------
      // Time Decay
      // -------------------------------

      const ageDays =
        (Date.now() - new Date(interaction.createdAt)) / (1000 * 60 * 60 * 24);

      const decay = Math.exp(-ageDays / 180);

      weight *= decay;

      if (
        interaction.action === "RATE" &&
        typeof interaction.metadata?.rating === "number"
      ) {
        weight *= interaction.metadata.rating / 5;
      }

      //----------------------------------
      // Authors
      //----------------------------------

      if (book.authors?.length) {
        book.authors.forEach((author) => {
          authorScores[author] = (authorScores[author] || 0) + weight;
        });
      }

      //----------------------------------
      //format
      //----------------------------------

      if (book.ebookUrl) {
        formatScores["ebook"] = (formatScores["ebook"] || 0) + weight;
      }

      if (book.audiobookUrl) {
        formatScores["audiobook"] = (formatScores["audiobook"] || 0) + weight;
      }

      if (!book.ebookUrl && !book.audiobookUrl) {
        formatScores["paperback"] = (formatScores["paperback"] || 0) + weight;
      }

      //----------------------------------
      // Categories
      //----------------------------------

      if (book.categories?.length) {
        book.categories.forEach((category) => {
          categoryScores[category] = (categoryScores[category] || 0) + weight;
        });
      }

      if (ageDays <= 90) {
        book.categories?.forEach((category) => {
          recentCategoryScores[category] =
            (recentCategoryScores[category] || 0) + weight;
        });
      }

      //----------------------------------
      // Average Price
      //----------------------------------

      if (book.price) {
        weightedPrice += book.price * weight;

        totalWeight += weight;
      }
    }

    const favoriteAuthors = Object.entries(authorScores)

      .sort((a, b) => b[1] - a[1])

      .slice(0, 20)

      .map(([author, score]) => ({
        author,

        score,
      }));

    const favoriteCategories = Object.entries(categoryScores)

      .sort((a, b) => b[1] - a[1])

      .slice(0, 20)

      .map(([category, score]) => ({
        category,

        score,
      }));

    const confidence = Math.min(1, interactions.length / 100);

    const favoriteFormats = Object.entries(formatScores)

      .sort((a, b) => b[1] - a[1])

      .slice(0, 10)

      .map(([format, score]) => ({
        format,

        score,
      }));

    const recentInterests = Object.entries(recentCategoryScores)

      .sort((a, b) => b[1] - a[1])

      .slice(0, 10)

      .map(([category, score]) => ({
        category,

        score,
      }));

    const profile = {
      user: userId,

      confidence,

      recentInterests,

      favoriteAuthors,

      favoriteFormats,

      favoriteCategories,

      averagePrice: totalWeight ? weightedPrice / totalWeight : 0,

      totalInteractions: interactions.length,
    };

    await UserPreference.findOneAndUpdate(
      {
        user: userId,
      },

      profile,

      {
        upsert: true,

        new: true,
      },
    );

    return profile;
  }

  async getProfile(userId) {
    return UserPreference.findOne({
      user: userId,
    });
  }

  /**
   * Returns top favourite categories
   */
  async getTopCategories(userId, limit = 3) {
    const profile = await UserPreference.findOne({
      user: userId,
    }).lean();

    if (!profile) return [];

    return profile.favoriteCategories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.category);
  }
}

module.exports = new ProfileService();
