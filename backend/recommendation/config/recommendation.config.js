module.exports = {

    EMBEDDING: {

        PROVIDER: "gemini",

        MODEL: "gemini-embedding-2",

        DIMENSIONS: 768,

        VERSION: 2

    },

    VECTOR_SEARCH: {

        INDEX: "book_embedding_index",

        DEFAULT_LIMIT: 20,

        NUM_CANDIDATES: 200

    },

    HYBRID: {

        SEMANTIC_WEIGHT: 0.45,

        COLLABORATIVE_WEIGHT: 0.30,

        POPULARITY_WEIGHT: 0.25

    },

    CACHE: {

        TTL: 60 * 60 * 24

    }

};