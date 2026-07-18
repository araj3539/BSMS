const mongoose = require("mongoose");

const UserInteractionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
      index: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "VIEW",
        "SEARCH",
        "CLICK",
        "ADD_CART",
        "REMOVE_CART",
        "WISHLIST",
        "REMOVE_WISHLIST",
        "PURCHASE",
        "RATE",
        "REVIEW",
        "READ",
        "LISTEN",
        "DOWNLOAD",
      ],
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// User Timeline
UserInteractionSchema.index({
  user: 1,
  createdAt: -1,
});

// Book Analytics
UserInteractionSchema.index({
  book: 1,
  action: 1,
});

// User + Book lookup
UserInteractionSchema.index({
  user: 1,
  book: 1,
});

module.exports = mongoose.model("UserInteraction", UserInteractionSchema);
