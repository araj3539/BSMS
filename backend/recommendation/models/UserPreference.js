const mongoose = require("mongoose");

const UserPreferenceSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true
    },

    favoriteGenres: [
        {
            genre: String,
            score: Number
        }
    ],

    favoriteAuthors: [
        {
            author: String,
            score: Number
        }
    ],

    favoriteCategories: [
        {
            category: String,
            score: Number
        }
    ],

    preferredLanguage: {
        type: String,
        default: null
    },

    averagePrice: {
        type: Number,
        default: 0
    },

    totalInteractions: {
        type: Number,
        default: 0
    }

},
{
    timestamps: true
});

module.exports = mongoose.model(
    "UserPreference",
    UserPreferenceSchema
);