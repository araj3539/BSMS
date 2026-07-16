const Book = require("../../models/Book");
const provider = require("../providers/gemini.provider");
const { buildEmbeddingText } = require("../utils/embeddingTextBuilder");

class EmbeddingService {
    constructor() {
        this.version = 2;
        this.provider = "gemini-embedding-2";
        this.dimensions = 768;
    }

    getEmbeddingVersion() {
        return this.version;
    }

    /**
     * Generate embedding from a Book object
     */
    async generateEmbedding(book) {

        const text = buildEmbeddingText(book);

        return provider.embed(text);

    }

    /**
     * Generate embedding directly from text
     */
    async generateEmbeddingFromText(text) {

        if (!text || !text.trim()) {
            throw new Error("Text is required");
        }

        return provider.embed(text);

    }

    /**
     * Update one book embedding
     */
    async updateBookEmbedding(bookId) {

        const book = await Book.findById(bookId);

        if (!book)
            throw new Error("Book not found");

        const embedding =
            await this.generateEmbedding(book);

        await Book.updateOne(

            { _id: book._id },

            {

                $set: {

                    embedding,

                    embeddingVersion: this.version,

                    embeddingMetadata: {

                        provider: this.provider,

                        version: this.version,

                        generatedAt: new Date(),

                        dimensions: embedding.length

                    }

                }

            }

        );

        return {

            bookId: book._id,

            title: book.title,

            dimensions: embedding.length

        };

    }

    /**
     * Regenerate every book
     */
    async regenerateAllEmbeddings() {

        const books =
            await Book.find();

        console.log(`Generating embeddings for ${books.length} books`);

        let success = 0;
        let failed = 0;

        for (const book of books) {

            try {

                await this.updateBookEmbedding(book._id);

                success++;

                console.log(`✓ ${book.title}`);

            }

            catch (err) {

                failed++;

                console.error(`✗ ${book.title}`);
                console.error(err.message);

            }

        }

        console.log({
            success,
            failed
        });

    }

    /**
     * Update only if needed
     */
    async regenerateIfNeeded(bookId) {

        const book =
            await Book.findById(bookId);

        if (!book)
            return null;

        if (

            !book.embedding ||

            book.embedding.length !== this.dimensions ||

            book.embeddingVersion !== this.version

        ) {

            return this.updateBookEmbedding(bookId);

        }

        return {

            bookId: book._id,

            title: book.title,

            dimensions: book.embedding.length

        };

    }

}

module.exports = new EmbeddingService();