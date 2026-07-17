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

        profileScore: {
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
      required: true,
      default: 1,
      index: true,
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

RecommendationCacheSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

RecommendationCacheSchema.index({
  user: 1,
  sourceBook: 1,
  algorithmVersion: 1,
});

module.exports = mongoose.model(
  "RecommendationCache",
  RecommendationCacheSchema,
);
