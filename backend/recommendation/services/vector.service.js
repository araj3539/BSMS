const Book = require("../../models/Book");
const embeddingService = require("./embedding.service");

class VectorService {
  constructor() {
    this.indexName = "book_embedding_index";
    this.defaultLimit = 20;
    this.defaultCandidates = 200;
  }

  /**
   * Generic Vector Search
   */
  async findNearest(queryVector, options = {}) {
    try {
      const {
        limit = this.defaultLimit,
        numCandidates = this.defaultCandidates,
        filter = {},
        excludeBookId = null,
        minScore = 0,
      } = options;

      const pipeline = [
        {
          $vectorSearch: {
            index: this.indexName,
            path: "embedding",
            queryVector,
            numCandidates,
            limit: excludeBookId ? limit + 1 : limit,
            filter,
          },
        },
        {
          $project: {
            _id: 1,

            title: 1,
            authors: 1,
            isbn: 1,
            categories: 1,
            publisher: 1,
            language: 1,
            image: 1,

            price: 1,
            stock: 1,
            averageRating: 1,
            totalRatings: 1,
            totalSales: 1,

            score: {
              $meta: "vectorSearchScore",
            },
          },
        },
      ];

      let results = await Book.aggregate(pipeline);

      results = results.filter((book) => book.score >= minScore);

      results = results.map((book) => ({
        ...book,
        confidence:
          book.score >= 0.95
            ? "Very High"
            : book.score >= 0.9
              ? "High"
              : book.score >= 0.8
                ? "Medium"
                : "Low",
      }));

      if (excludeBookId) {
        results = results.filter(
          (book) => book._id.toString() !== excludeBookId.toString(),
        );

        results = results.slice(0, limit);
      }

      return results;
    } catch (error) {
      console.error("Vector Search Error:", error);
      throw error;
    }
  }

  /**
   * Similar Books using Book ID
   */
  async findNearestByBook(bookId, options = {}) {
    const book = await Book.findById(bookId).select("+embedding");

    if (!book) {
      throw new Error("Book not found");
    }

    if (!book.embedding || book.embedding.length === 0) {
      throw new Error("Book embedding not found");
    }

    return this.findNearest(book.embedding, {
      ...options,
      excludeBookId: bookId,
    });
  }

  /**
   * Similar Books using Search Text
   */
  async findNearestByText(text, options = {}) {
    const embedding = await embeddingService.generateEmbeddingFromText(text);

    return this.findNearest(embedding, options);
  }

  /**
   * Find nearest books using an existing embedding
   */
  async findNearestByEmbedding(embedding, options = {}) {
    if (!embedding || embedding.length === 0) {
      throw new Error("Invalid embedding");
    }

    return this.findNearest(embedding, options);
  }

  /**
   * Find books inside a category
   */
  async findNearestInCategory(embedding, category, options = {}) {
    return this.findNearest(embedding, {
      ...options,
      filter: {
        categories: category,
      },
    });
  }

  /**
   * Find books in stock only
   */
  async findNearestAvailable(embedding, options = {}) {
    return this.findNearest(embedding, {
      ...options,
      filter: {
        stock: {
          $gt: 0,
        },
      },
    });
  }

  /**
   * Semantic Search
   */
  async semanticSearch(query, options = {}) {
    return this.findNearestByText(query, {
      minScore: 0.75,
      ...options,
    });
  }

  /**
   * Similar Books
   */
  async similarBooks(bookId, options = {}) {
    return this.findNearestByBook(bookId, {
      minScore: 0.8,
      ...options,
    });
  }

  /**
   * Health Check
   */
  async testVectorSearch() {
    const sample = await Book.findOne().select("+embedding");

    console.log("Book:", sample.title);
    console.log("Embedding exists:", !!sample.embedding);
    console.log("Embedding length:", sample.embedding?.length);

    if (!sample) throw new Error("No books found");

    const results = await this.findNearest(sample.embedding, {
      limit: 5,
      excludeBookId: sample._id,
    });

    return {
      testedBook: sample.title,
      count: results.length,
      results,
    };
  }
}

module.exports = new VectorService();
