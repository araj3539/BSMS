class RecommendationCandidate {

    constructor({

        bookId,

        score,

        source,

        metadata = {}

    }) {

        this.bookId = bookId;

        this.score = score;

        this.source = source;

        this.metadata = metadata;

    }

}

module.exports = RecommendationCandidate;