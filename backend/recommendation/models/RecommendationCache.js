const mongoose = require("mongoose");

const RecommendationCacheSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    sourceBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },

    recommendations: [
      {
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },

        semanticScore: {
          type: Number,
          default: 0,
        },

        collaborativeScore: {
          type: Number,
          default: 0,
        },

        popularityScore: {
          type: Number,
          default: 0,
        },

        finalScore: {
          type: Number,
          required: true,
        },

        reasons: {
          type: [String],
          default: [],
        },
      },
    ],

    algorithmVersion: {
      type: Number,
      default: 1,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Automatically delete expired cache entries.
 */
RecommendationCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Fast lookup.
 */
RecommendationCacheSchema.index({
  user: 1,
  sourceBook: 1,
});

module.exports = mongoose.model(
  "RecommendationCache",
  RecommendationCacheSchema,
);
