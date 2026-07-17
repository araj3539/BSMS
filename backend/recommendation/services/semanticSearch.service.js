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

    const {
      limit = this.DEFAULT_LIMIT,

      inStockOnly = false,

      category = null,
    } = options;

    //------------------------------------------------
    // Vector Search
    //------------------------------------------------

    let results;

    if (category) {
      // Generate embedding from query

      const embedding = await embeddingService.generateEmbeddingFromText(query);

      results = await vectorService.findNearestInCategory(
        embedding,

        category,

        {
          limit,
        },
      );
    } else if (inStockOnly) {
      const embedding = await embeddingService.generateEmbeddingFromText(query);

      results = await vectorService.findNearestAvailable(
        embedding,

        {
          limit,
        },
      );
    } else {
      results = await vectorService.findNearestByText(
        query,

        {
          limit,
        },
      );
    }

    //------------------------------------------------
    // Load Books
    //------------------------------------------------

    const scoreMap = new Map();

    results.forEach((result) => {
      scoreMap.set(
        result._id.toString(),

        result.score,
      );
    });

    if (results.length === 0) {
      return [];
    }

    const books = await Book.find({
      _id: {
        $in: results.map((r) => r._id),
      },
    }).lean();

    return books

      .map((book) => ({
        ...book,

        semanticScore: scoreMap.get(book._id.toString()) || 0,
      }))

      .sort((a, b) => b.semanticScore - a.semanticScore);
  }
}

module.exports = new SemanticSearchService();
