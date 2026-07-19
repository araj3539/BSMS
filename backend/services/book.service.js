const Book = require("../models/Book");

class BookService {
  /**
   * Parse array-like values.
   *
   * Supports:
   * - ["A","B"]
   * - "['A','B']"
   * - '["A","B"]'
   * - "A,B,C"
   * - "A"
   */
  parseArrayField(value) {
    if (!value) return [];

    // Already an array
    if (Array.isArray(value)) {
      return value
        .map(String)
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (typeof value !== "string") {
      return [String(value)];
    }

    const text = value.trim();

    // JSON Array
    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed
          .map(String)
          .map((v) => v.trim())
          .filter(Boolean);
      }
    } catch (_) {}

    // Python style list
    if (text.startsWith("[") && text.endsWith("]")) {
      return text
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }

    // Comma separated
    return text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  /**
   * Remove duplicates while preserving order.
   */
  unique(list) {
    return [...new Set(list)];
  }

  /**
   * Convert text into Title Case.
   */
  titleCase(text) {
    return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  normalizeAuthors(author, authors = []) {
    const list = [
      ...this.parseArrayField(author),
      ...this.parseArrayField(authors),
    ];

    return this.unique(list.map((a) => a.trim()).filter(Boolean));
  }

  normalizeCategories(category, categories = []) {
    const list = [
      ...this.parseArrayField(category),
      ...this.parseArrayField(categories),
    ];

    return this.unique(
      list.map((c) => this.titleCase(c.trim())).filter(Boolean),
    );
  }

  buildSearchText(book) {
    return [
      `Title: ${book.title}`,
      `Authors: ${(book.authors || []).join(", ")}`,
      `Categories: ${(book.categories || []).join(", ")}`,
      `Description: ${book.description || ""}`,
      `ISBN: ${book.isbn || ""}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  prepareBook(data) {
    const authors = this.normalizeAuthors(data.author, data.authors);

    const categories = this.normalizeCategories(data.category, data.categories);

    const searchText = this.buildSearchText({
      ...data,
      authors,
      categories,
    });

    return {
      ...data,

      authors,
      categories,

      searchText,

      embeddingMetadata: {
        provider: data.embeddingMetadata?.provider || "gemini-embedding-2",

        version: data.embeddingMetadata?.version || 2,

        dimensions: data.embeddingMetadata?.dimensions || 768,

        generatedAt: null,

        // Every create/update requires regeneration
        status: "pending",
      },
    };
  }

  async createBook(data) {
    if (!data.title) {
      throw new Error("Book title is required.");
    }

    const prepared = this.prepareBook(data);

    return await Book.create(prepared);
  }

  async updateBook(bookId, updates) {
    const existingBook = await Book.findById(bookId);

    if (!existingBook) return null;

    const mergedData = {
      ...existingBook.toObject(),
      ...updates,
    };

    const prepared = this.prepareBook(mergedData);

    return await Book.findByIdAndUpdate(bookId, prepared, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Rebuild search text for existing book.
   */
  async rebuildSearchText(bookId) {
    const book = await Book.findById(bookId);

    if (!book) return null;

    const prepared = this.prepareBook(book.toObject());

    book.authors = prepared.authors;
    book.categories = prepared.categories;
    book.searchText = prepared.searchText;

    book.embeddingMetadata.status = "pending";

    await book.save();

    return book;
  }

  /**
   * Mark embedding generation completed.
   */
  async markEmbeddingCompleted(bookId, embedding) {
    return await Book.findByIdAndUpdate(
      bookId,
      {
        embedding,

        "embeddingMetadata.status": "completed",

        "embeddingMetadata.generatedAt": new Date(),
      },
      {
        new: true,
      },
    );
  }

  /**
   * Mark embedding generation failed.
   */
  async markEmbeddingFailed(bookId) {
    return await Book.findByIdAndUpdate(
      bookId,
      {
        "embeddingMetadata.status": "failed",
      },
      {
        new: true,
      },
    );
  }
}

module.exports = new BookService();
