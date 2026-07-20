const vectorService = require("../services/vector.service");

class SemanticRecommendation {
  /**
   * Recommend similar books using vector similarity
   */
  async recommend(bookId, options = {}) {
    const candidates = await vectorService.similarBooks(bookId, {
      minScore: 0.75,
      ...options,
    });

    return candidates.map((candidate) => ({
      book: candidate,

      semanticScore: candidate.score,

      confidence: candidate.confidence,
    }));
  }

  /**
   * Recommend books from free-text query
   */
  async recommendByText(query, options = {}) {
    const candidates = await vectorService.semanticSearch(query, {
      minScore: 0.75,
      ...options,
    });

    return candidates.map((candidate) => ({
      book: candidate,

      semanticScore: candidate.score,

      confidence: candidate.confidence,
    }));
  }

  /**
   * Recommend using an existing embedding
   */
  async recommendByEmbedding(embedding, options = {}) {
    const candidates = await vectorService.findNearestByEmbedding(embedding, {
      minScore: 0.75,
      ...options,
    });

    return candidates.map((candidate) => ({
      book: candidate,

      semanticScore: candidate.score,

      confidence: candidate.confidence,
    }));
  }
}

module.exports = new SemanticRecommendation();
