const UserInteraction = require("../models/UserInteraction");
const UserPreference = require("../models/UserPreference");
const Book = require("../../models/Book");

const weights = require("../utils/interactionWeights");

class ProfileService {

    async buildUserProfile(userId) {

        const interactions = await UserInteraction.find({
            user: userId
        });

        if (!interactions.length)
            return null;

        const genreScores = {};
        const authorScores = {};
        const categoryScores = {};

        let totalPrice = 0;
        let totalWeight = 0;

        for (const interaction of interactions) {

            const book = await Book.findById(interaction.book);

            if (!book)
                continue;

            const weight = weights[interaction.action] || 1;

            // Category

            if (book.category) {

                categoryScores[book.category] =
                    (categoryScores[book.category] || 0) + weight;

            }

            // Author

            if (book.author) {

                authorScores[book.author] =
                    (authorScores[book.author] || 0) + weight;

            }

            // Genre

            if (book.genres) {

                for (const genre of book.genres) {

                    genreScores[genre] =
                        (genreScores[genre] || 0) + weight;

                }

            }

            totalPrice += book.price * weight;
            totalWeight += weight;

        }

        const averagePrice =
            totalWeight === 0
                ? 0
                : Math.round(totalPrice / totalWeight);

        const profile = {

            favoriteGenres:
                Object.entries(genreScores)
                    .map(([genre, score]) => ({ genre, score }))
                    .sort((a, b) => b.score - a.score),

            favoriteAuthors:
                Object.entries(authorScores)
                    .map(([author, score]) => ({ author, score }))
                    .sort((a, b) => b.score - a.score),

            favoriteCategories:
                Object.entries(categoryScores)
                    .map(([category, score]) => ({ category, score }))
                    .sort((a, b) => b.score - a.score),

            averagePrice,

            totalInteractions: interactions.length

        };

        await UserPreference.findOneAndUpdate(
            { user: userId },
            profile,
            {
                upsert: true,
                new: true
            }
        );

        return profile;

    }

}

module.exports = new ProfileService();