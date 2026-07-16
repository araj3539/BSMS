class RecommendationExplainer {

    explain(item) {

        const reasons = [];

        if (item.semanticScore > 0.70) {
            reasons.push("Similar to the selected book");
        }

        if (item.collaborativeScore > 0) {
            reasons.push("Popular among readers with similar interests");
        }

        if (item.popularityScore > 0.60) {
            reasons.push("Trending among readers");
        }

        if (
            item.book.rating >= 4.5 &&
            item.book.numReviews >= 50
        ) {
            reasons.push("Highly rated by readers");
        }

        if (
            item.book.stock > 0 &&
            item.book.stock <= 5
        ) {
            reasons.push("Limited stock available");
        }

        if (reasons.length === 0) {
            reasons.push("Recommended for you");
        }

        return reasons;
    }

    explainAll(recommendations) {

        return recommendations.map(item => ({
            ...item,
            reasons: this.explain(item)
        }));

    }

}

module.exports = new RecommendationExplainer();