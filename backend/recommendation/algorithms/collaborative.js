const mongoose = require("mongoose");
const UserInteraction = require("../models/UserInteraction");
const Book = require("../../models/Book");

const ObjectId = mongoose.Types.ObjectId;

const ACTION_WEIGHTS = {
  VIEW: 1,
  SEARCH: 1,
  CLICK: 2,
  ADD_CART: 4,
  REMOVE_CART: -1,
  WISHLIST: 3,
  REMOVE_WISHLIST: -1,
  PURCHASE: 8,
  RATE: 5,
  REVIEW: 6,
  READ: 4,
  LISTEN: 4,
  DOWNLOAD: 5,
};

class CollaborativeRecommendation {
  async recommend(userId, options = {}) {
    const { limit = 20 } = options;

    //------------------------------------------
    // Step 1 : Current User History
    //------------------------------------------

    const myInteractions = await UserInteraction.find({
      user: userId,
      book: { $ne: null },
    }).lean();

    if (!myInteractions.length) return [];

    const myBookWeights = new Map();
    const myBooks = [];

    for (const interaction of myInteractions) {
      if (!interaction.book) continue;

      const id = interaction.book.toString();

      if (!myBooks.includes(id)) myBooks.push(id);

      let weight = ACTION_WEIGHTS[interaction.action] || 1;

      // Rating-aware weighting
      if (
        interaction.action === "RATE" &&
        typeof interaction.metadata?.rating === "number"
      ) {
        weight *= interaction.metadata.rating / 5;
      }

      myBookWeights.set(id, (myBookWeights.get(id) || 0) + weight);
    }

    //------------------------------------------
    //Step 2 : Load Candidate Interactions
    //------------------------------------------

    const candidateInteractions = await UserInteraction.find({
      user: { $ne: userId },
      book: {
        $in: myBooks.map((id) => new ObjectId(id)),
      },
    }).lean();

    if (!candidateInteractions.length) return [];

    //------------------------------------------
    // Step 3 : Calculate User Similarity
    //------------------------------------------

    const similarityMap = new Map();

    for (const interaction of candidateInteractions) {
      if (!interaction.book) continue;

      const bookId = interaction.book.toString();

      const myWeight = myBookWeights.get(bookId);

      if (!myWeight) continue;

      let theirWeight = ACTION_WEIGHTS[interaction.action] || 1;

      if (
        interaction.action === "RATE" &&
        typeof interaction.metadata?.rating === "number"
      ) {
        theirWeight *= interaction.metadata.rating / 5;
      }

      const similarity = Math.min(myWeight, theirWeight);

      similarityMap.set(
        interaction.user.toString(),
        (similarityMap.get(interaction.user.toString()) || 0) + similarity,
      );
    }

    const similarUsers = [...similarityMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([user, similarity]) => ({
        _id: new ObjectId(user),

        similarity,
      }));

    if (!similarUsers.length) return [];

    // Step 4 : Score Candidate Books

    const similarityLookup = new Map(
      similarUsers.map((user) => [user._id.toString(), user.similarity]),
    );

    const scoreMap = new Map();

    const interactions = await UserInteraction.find({
      user: {
        $in: similarUsers.map((user) => user._id),
      },
      book: { $ne: null },
    }).lean();

    for (const interaction of interactions) {
      if (!interaction.book) continue;

      const id = interaction.book.toString();

      // Don't recommend books the user already knows
      if (myBooks.includes(id)) continue;

      const similarity = similarityLookup.get(interaction.user.toString());

      if (!similarity) continue;

      let weight = ACTION_WEIGHTS[interaction.action] || 1;

      if (
        interaction.action === "RATE" &&
        typeof interaction.metadata?.rating === "number"
      ) {
        weight *= interaction.metadata.rating / 5;
      }

      scoreMap.set(id, (scoreMap.get(id) || 0) + similarity * weight);
    }

    //------------------------------------------
    // Step 5 : Top Ranked Books
    //------------------------------------------

    const ranked = [...scoreMap.entries()]

      .sort((a, b) => b[1] - a[1])

      .slice(0, limit);

    if (!ranked.length) return [];

    //------------------------------------------
    // Step 6 : Load Books
    //------------------------------------------

    const ids = ranked.map((r) => new ObjectId(r[0]));

    const books = await Book.find({
      _id: {
        $in: ids,
      },
    }).lean();

    const bookMap = new Map();

    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    //------------------------------------------
    // Step 7 : Normalize Score
    //------------------------------------------

    const maxScore = ranked[0][1];

    return ranked

      .map(([id, score]) => {
        const book = bookMap.get(id);

        if (!book) return null;

        return {
          book,

          collaborativeScore: maxScore ? score / maxScore : 0,
        };
      })

      .filter(Boolean);
  }
}

module.exports = new CollaborativeRecommendation();
