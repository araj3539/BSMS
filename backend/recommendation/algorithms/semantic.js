const Book = require("../../models/Book");
const vectorService = require("../services/vector.service");

class SemanticRecommendation {

    /**
     * Get semantic recommendations for a book
     */
    async recommend(bookId, options = {}) {

        const candidates =
            await vectorService.findNearestByBook(bookId, options);

        if (!candidates.length)
            return [];

        const ids =
            candidates.map(c => c._id);

        const books =
            await Book.find({
                _id: { $in: ids }
            });

        const bookMap = new Map();

        books.forEach(book => {
            bookMap.set(book._id.toString(), book);
        });

        const recommendations = [];

        for (const candidate of candidates) {

            const book =
                bookMap.get(candidate._id.toString());

            if (!book)
                continue;

            recommendations.push({

                book,

                semanticScore: candidate.score

            });

        }

        return recommendations;

    }

}

module.exports = new SemanticRecommendation();