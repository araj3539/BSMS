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

    const genreScores = {};
    const categoryScores = {};
    const authorScores = {};

    let totalPrice = 0;
    let priceCount = 0;

    for (const interaction of interactions) {
      const book = interaction.book;

      if (!book) continue;

      let weight = ACTION_WEIGHTS[interaction.action] || 1;

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
      // Categories
      //----------------------------------

      if (book.categories?.length) {
        book.categories.forEach((category) => {
          categoryScores[category] = (categoryScores[category] || 0) + weight;
        });
      }

      //----------------------------------
      // Genres
      //----------------------------------

      if (book.genres?.length) {
        book.genres.forEach((genre) => {
          genreScores[genre] = (genreScores[genre] || 0) + weight;
        });
      }

      //----------------------------------
      // Average Price
      //----------------------------------

      if (book.price) {
        totalPrice += book.price;

        priceCount++;
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

    const favoriteGenres = Object.entries(genreScores)

      .sort((a, b) => b[1] - a[1])

      .slice(0, 20)

      .map(([genre, score]) => ({
        genre,

        score,
      }));

    const profile = {
      user: userId,

      favoriteAuthors,

      favoriteCategories,

      favoriteGenres,

      averagePrice: priceCount ? totalPrice / priceCount : 0,

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
