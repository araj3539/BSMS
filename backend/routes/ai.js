const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of common words to ignore in search queries to improve relevance
const STOP_WORDS = [
  'who', 'is', 'the', 'author', 'of', 'book', 'books', 'tell', 'me', 'about', 
  'suggest', 'recommend', 'recommendation', 'list', 'some', 'any', 'good', 'best', 
  'top', 'read', 'reading', 'in', 'stock', 'price', 'cost', 'much', 'how', 'hi', 
  'hello', 'hey', 'store', 'shop', 'inventory', 'available', 'have', 'do', 'you',
  'can', 'please', 'details', 'summary', 'plot', 'story', 'writer', 'written', 'by'
];

router.post('/chat', async (req, res) => {
  try {
    const { message, context, history } = req.body; 
    
    // --- 1. SMART SEARCH (RAG) ---
    let inventoryContext = "";
    
    try {
      const lowerMsg = message.toLowerCase();
      let books = [];

      // A. CLEAN KEYWORDS
      const rawWords = lowerMsg.replace(/[?.!,]/g, '').split(/\s+/);
      const keywords = rawWords.filter(w => w.length > 2 && !STOP_WORDS.includes(w));

      // B. DETECT INTENT
      if ((lowerMsg.includes('best') || lowerMsg.includes('top') || lowerMsg.includes('popular')) && keywords.length === 0) {
         books = await Book.find().sort({ rating: -1, soldCount: -1 }).limit(10).select('title author price stock category description rating');
         inventoryContext += "### TOP RATED / BESTSELLING BOOKS:\n";
      } 
      // C. SPECIFIC SEARCH
      else if (keywords.length > 0) {
        const regexQueries = keywords.map(k => ({ 
          $or: [
            { title: { $regex: k, $options: 'i' } },
            { author: { $regex: k, $options: 'i' } },
            { category: { $regex: k, $options: 'i' } } 
          ]
        }));
        
        books = await Book.find({ $or: regexQueries })
          .limit(20)
          .select('title author price stock category description rating');
      }

      // D. FALLBACK
      if (books.length === 0) {
         const bestsellers = await Book.find().sort({ soldCount: -1 }).limit(5).select('title author price stock category description rating');
         inventoryContext += "### BESTSELLERS (General Recommendations):\n";
         books = bestsellers;
      }

      // E. FORMAT DATA (UPDATED FOR LINKS)
      // We now format the title as a Markdown link: [**Title**](/book/ID)
      inventoryContext += books.map(b => 
        `- [**${b.title}**](/book/${b._id}) by ${b.author} (Rating: ${b.rating}★, Price: ₹${b.price})\n  *${b.stock > 0 ? 'In Stock' : 'Out of Stock'}* - ${b.description ? b.description.substring(0, 120) : 'No description'}...`
      ).join('\n\n');

    } catch (err) {
      console.error("RAG Error", err);
    }

    const inventoryData = inventoryContext || "NO BOOKS AVAILABLE.";
    const currentBookContext = context 
      ? `User is currently viewing: **${context.title}** by ${context.author}.` 
      : "User is browsing the store.";

    let formattedHistory = (history || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model', 
        parts: [{ text: msg.text }]
    }));

    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
    }

    // --- 3. SYSTEM PROMPT (UPDATED) ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: `
        You are the knowledgeable Bookstore Assistant for "Readify".
        
        ### 🎯 YOUR GOAL:
        Help customers find books using ONLY the provided inventory.

        ### 🧠 CRITICAL RULES:
        1. **LINKS:** When suggesting a book, you MUST use the link format provided in the inventory (e.g., [**Title**](/book/id)). This allows the user to click and view the book.
        2. **INVENTORY CHECK:** If a book is NOT listed in the "STORE INVENTORY" below, do not recommend it.
        3. **NO OFF-TOPIC:** Refuse questions about news, weather, math, or coding.
        4. **FORMATTING:** Keep it concise.

        ### 📚 STORE INVENTORY (Source of Truth):
        ${inventoryData}
      `
    });

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(`CONTEXT: ${currentBookContext}\nUSER QUESTION: ${message}`);
    const aiReply = result.response.text();

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ reply: "I'm having a little trouble checking the shelves. Ask me again in a moment!" });
  }
});

module.exports = router;