const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Book = require("../models/Book");
const semanticSearchService = require("../recommendation/services/semanticSearch.service");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of common words to ignore in search queries to improve relevance
const STOP_WORDS = [
  "who",
  "is",
  "the",
  "author",
  "of",
  "book",
  "books",
  "tell",
  "me",
  "about",
  "suggest",
  "recommend",
  "recommendation",
  "list",
  "some",
  "any",
  "good",
  "best",
  "top",
  "read",
  "reading",
  "in",
  "stock",
  "price",
  "cost",
  "much",
  "how",
  "hi",
  "hello",
  "hey",
  "store",
  "shop",
  "inventory",
  "available",
  "have",
  "do",
  "you",
  "can",
  "please",
  "details",
  "summary",
  "plot",
  "story",
  "writer",
  "written",
  "by",
];

router.post("/chat", async (req, res) => {
  try {
    const { message, context, history } = req.body;

    // --- 1. HANDLING "CURRENT BOOK" CONTEXT (The Fix) ---
    let currentBookContext = "User is browsing the store.";
    let focusedBook = null;

    // If frontend sent a bookId, fetch the REAL data from DB
    if (context && context.bookId) {
      try {
        focusedBook = await Book.findById(context.bookId);
        if (focusedBook) {
          // We feed the AI the specific details of the book the user is looking at
          currentBookContext = `
            User is currently looking at this specific book:
            Title: "${focusedBook.title}"
            Author: ${focusedBook.author}
            Price: ₹${focusedBook.price}
            Stock: ${focusedBook.stock}
            Description: ${focusedBook.description}
          `;
        }
      } catch (err) {
        console.log("Error fetching context book:", err.message);
      }
    }

    // --- 2. SMART SEARCH (RAG) ---
    let inventoryContext = "";

    try {
      const lowerMsg = message.toLowerCase();
      let books = [];

      const isAskingAboutContext =
        (lowerMsg.includes("this book") || lowerMsg.includes("it")) &&
        focusedBook;

      if (!isAskingAboutContext) {
        // 1. Convert the user's chat message into a mathematical vector
        // -------------------------------------------------------
        // Semantic Search using centralized recommendation engine
        // -------------------------------------------------------

        const searchResult = await semanticSearchService.search(message, {
          limit: 20,
          inStockOnly: false,
        });

        // Normalize semanticSearchService response
        if (Array.isArray(searchResult)) {
          books = searchResult;
        } else if (Array.isArray(searchResult?.books)) {
          books = searchResult.books;
        } else if (Array.isArray(searchResult?.results)) {
          books = searchResult.results;
        } else {
          console.error(
            "[AI Chat] Unexpected semantic search response:",
            searchResult,
          );

          books = [];
        }

        console.log(
          "[AI Chat] Semantic Search Results:",
          books.slice(0, 10).map((item) => ({
            title: item.title || item.book?.title,
            score: item.semanticScore ?? item.score ?? item.book?.semanticScore,
          })),
        );

        // Normalize recommendation-shaped results if necessary
        books = books
          .map((item) => {
            if (item.book) {
              return {
                ...item.book,
                semanticScore:
                  item.semanticScore ??
                  item.score ??
                  item.book.semanticScore ??
                  0,
              };
            }

            return item;
          })
          .slice(0, 8);
        console.log(
          "Raw Vector Search Results:",
          books.map((b) => ({ title: b.title, score: b.score })),
        );

        // FILTERING (Optional): Only keep results with a strong similarity score
        // books = books.filter((b) => b.score > 0.65);

        // FORMAT DATA
        if (books.length > 0) {
          inventoryContext += books
            .map(
              (b) => `
- [**${b.title}**](/book/${b._id})
  Author: ${b.author || "Unknown"}
  Categories: ${
    Array.isArray(b.categories)
      ? b.categories.join(", ")
      : b.category || "Unknown"
  }
  Rating: ${b.rating || 0}★
  Price: ₹${b.price}
  Status: ${b.stock > 0 ? `In Stock (${b.stock})` : "Out of Stock"}
  Semantic Match: ${
    typeof b.semanticScore === "number" ? b.semanticScore.toFixed(3) : "N/A"
  }
  Description: ${
    b.description ? b.description.substring(0, 300) : "No description available"
  }
`,
            )
            .join("\n");
        } else {
          const bestsellers = await Book.find()
            .sort({ soldCount: -1 })
            .limit(3)
            .select(
              "title author authors price stock category categories description rating",
            );

          inventoryContext += "### BESTSELLERS (General Recommendations):\n";

          inventoryContext += bestsellers
            .map(
              (b) =>
                `- [**${b.title}**](/book/${b._id}) by ${b.author || "Unknown"}`,
            )
            .join("\n");
        }
      } else {
        inventoryContext =
          "User is asking about the book defined in CONTEXT above. Answer based on that.";
      }
    } catch (err) {
      console.error("Vector Search RAG Error", err);
    }

    const inventoryData = inventoryContext || "NO OTHER BOOKS FOUND.";

    let formattedHistory = (history || []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Ensure history starts with user (Gemini requirement)
    if (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
      formattedHistory.shift();
    }

    // --- 3. SYSTEM PROMPT ---
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
        You are the knowledgeable Bookstore Assistant for "Readify".
        
        ### 🎯 YOUR GOAL:
        Help customers find books using ONLY the provided inventory.

        ### 🧠 CRITICAL RULES:
        1. **CONTEXT FIRST:** If the "CURRENT CONTEXT" below has book details, use that to answer questions like "tell me more" or "what is the price?".
        2. **LINKS:** When suggesting a book, you MUST use the link format provided in the inventory (e.g., [**Title**](/book/id)).
        3. **INVENTORY CHECK:** If a book is NOT listed in the "STORE INVENTORY" or "CURRENT CONTEXT", do not recommend it.
        4. **NO OFF-TOPIC:** Refuse questions about news, weather, math, or coding.

        ### 📚 STORE INVENTORY (Search Results):
        ${inventoryData}
      `,
    });

    const chat = model.startChat({
      history: formattedHistory,
    });

    // We pass the focused book details explicitly in the prompt
    const finalPrompt = `
    CURRENT CONTEXT: 
    ${currentBookContext}

    USER QUESTION: 
    ${message}
    `;

    const result = await chat.sendMessage(finalPrompt);
    const aiReply = result.response.text();

    res.json({ reply: aiReply });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({
      reply:
        "I'm having a little trouble checking the shelves. Ask me again in a moment!",
    });
  }
});

module.exports = router;
