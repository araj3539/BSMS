const User = require("../../models/User");
const Order = require("../../models/Order");
const UserPreference = require("../models/UserPreference");

class CustomerProfileService {
  async getProfile(userId) {
    const [user, orders, preference] = await Promise.all([
      User.findById(userId).select("-password").lean(),
      Order.find({
        userId,
        paymentStatus: "paid",
        status: { $ne: "cancelled" },
      }).lean(),
      UserPreference.findOne({ user: userId }).lean(),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    // -------------------------
    // Purchased Books
    // -------------------------

    let booksPurchased = 0;
    let amountSpent = 0;

    const categoryMap = {};
    const authorMap = {};

    orders.forEach((order) => {
      amountSpent += order.totalAmount || 0;

      order.items.forEach((item) => {
        booksPurchased += item.qty;

        if (item.categories) {
          item.categories.forEach((cat) => {
            categoryMap[cat] = (categoryMap[cat] || 0) + item.qty;
          });
        }

        if (item.authors) {
          item.authors.forEach((author) => {
            authorMap[author] = (authorMap[author] || 0) + item.qty;
          });
        }
      });
    });

    // -------------------------
    // Favourite Categories
    // -------------------------

    const favoriteCategories =
      preference?.favoriteCategories?.length > 0
        ? preference.favoriteCategories
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
        : Object.entries(categoryMap)
            .map(([category, score]) => ({
              category,
              score,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

    // -------------------------
    // Favourite Authors
    // -------------------------

    const favoriteAuthors =
      preference?.favoriteAuthors?.length > 0
        ? preference.favoriteAuthors
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
        : Object.entries(authorMap)
            .map(([author, score]) => ({
              author,
              score,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

    // -------------------------
    // Reader Level
    // -------------------------

    let readerLevel = "Beginner";

    if (booksPurchased >= 10) readerLevel = "Explorer";
    if (booksPurchased >= 30) readerLevel = "Avid Reader";
    if (booksPurchased >= 60) readerLevel = "Book Master";

    // -------------------------
    // AI Summary
    // -------------------------

    const topCategories = favoriteCategories
      .slice(0, 3)
      .map((c) => c.category)
      .join(", ");

    const aiSummary =
      booksPurchased === 0
        ? "Your reading profile is still being built. Start exploring books to receive personalized recommendations."
        : `You mainly enjoy ${topCategories}. Based on your purchases and interactions, our recommendation engine is prioritizing books from your favourite categories and authors.`;

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        memberSince: user.createdAt,
      },

      statistics: {
        booksPurchased,
        wishlistCount: user.wishlist?.length || 0,
        cartCount: user.cart?.length || 0,
        totalOrders: orders.length,
        amountSpent,
      },

      readerLevel,

      recommendationProfile: {
        confidence: preference?.confidence || 0,
        totalInteractions: preference?.totalInteractions || 0,
      },

      favoriteCategories,

      favoriteAuthors,

      aiSummary,
    };
  }
}

module.exports = new CustomerProfileService();