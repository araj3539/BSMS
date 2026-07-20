const Book = require("../../models/Book");
const vectorService = require("./vector.service");
const embeddingService = require("./embedding.service");

class SemanticSearchService {
  constructor() {
    this.DEFAULT_LIMIT = 20;
  }

  /**
   * Semantic Search
   */
  async search(query, options = {}) {
    if (!query || !query.trim()) {
      return [];
    }

    query = query.trim();

    const {
      limit = this.DEFAULT_LIMIT,
      minScore = 0.75,
      inStockOnly = false,
      category = null,
    } = options;

    let results;

    // Generate embedding only when required
    const embedding =
      category || inStockOnly
        ? await embeddingService.generateEmbeddingFromText(query)
        : null;

    if (category) {
      results = await vectorService.findNearestInCategory(embedding, category, {
        limit,
        minScore,
      });
    } else if (inStockOnly) {
      results = await vectorService.findNearestAvailable(embedding, {
        limit,
        minScore,
      });
    } else {
      results = await vectorService.semanticSearch(query, {
        limit,
        minScore,
      });
    }

    return {
      query,
      totalResults: results.length,
      results,
    };
  }
}

module.exports = new SemanticSearchService();
