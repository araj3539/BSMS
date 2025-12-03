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

      // A. CLEAN KEYWORDS: Remove stop words to find the "core" subject
      const rawWords = lowerMsg.replace(/[?.!,]/g, '').split(/\s+/);
      const keywords = rawWords.filter(w => w.length > 2 && !STOP_WORDS.includes(w));

      // B. DETECT INTENT: "Best", "Top", "Popular"
      if ((lowerMsg.includes('best') || lowerMsg.includes('top') || lowerMsg.includes('popular')) && keywords.length === 0) {
         // If user just says "Best books" without specific keywords, show top rated
         books = await Book.find().sort({ rating: -1, soldCount: -1 }).limit(10).select('title author price stock category description rating');
         inventoryContext += "### TOP RATED / BESTSELLING BOOKS:\n";
      } 
      // C. SPECIFIC SEARCH (The Core Fix)
      else if (keywords.length > 0) {
        const regexQueries = keywords.map(k => ({ 
          $or: [
            { title: { $regex: k, $options: 'i' } },
            { author: { $regex: k, $options: 'i' } },
            // Give lower priority to category/description matches in strict search
            { category: { $regex: k, $options: 'i' } } 
          ]
        }));
        
        // Fetch up to 20 matches (increased from 10 to prevent cache misses)
        books = await Book.find({ $or: regexQueries })
          .limit(20)
          .select('title author price stock category description rating');
      }

      // D. FALLBACK: If search failed (or greeting), show a mix of Bestsellers & New Arrivals
      if (books.length === 0) {
         const bestsellers = await Book.find().sort({ soldCount: -1 }).limit(5).select('title author price stock category description rating');
         // Add explicit label so AI knows these are general recommendations
         inventoryContext += "### BESTSELLERS (General Recommendations):\n";
         books = bestsellers;
      }

      // E. Format Data for AI
      inventoryContext += books.map(b => 
        `- **${b.title}** by ${b.author} (Rating: ${b.rating}★, Price: ₹${b.price})\n  *${b.stock > 0 ? 'In Stock' : 'Out of Stock'}* - ${b.description ? b.description.substring(0, 120) : 'No description'}...`
      ).join('\n\n');

    } catch (err) {
      console.error("RAG Error", err);
    }

    const inventoryData = inventoryContext || "NO BOOKS AVAILABLE.";
    const currentBookContext = context 
      ? `User is currently viewing: **${context.title}** by ${context.author}.` 
      : "User is browsing the store.";

    // --- 2. FORMAT HISTORY ---
    let formattedHistory = (history || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model', 
        parts: [{ text: msg.text }]
    }));

    // Fix: Remove initial model message if it exists (Gemini constraint)
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
    }

    // --- 3. SYSTEM PROMPT ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: `
        You are the knowledgeable Bookstore Assistant for "BookShop".
        
        ### 🎯 YOUR GOAL:
        Help customers find books, answer questions about specific titles, and make purchase decisions using ONLY the provided inventory.

        ### 🧠 CRITICAL RULES:
        1. **CONTEXT AWARENESS:** If the user asks about "this book" or "the author", look at the "User is viewing" context first.
        2. **INVENTORY CHECK:** - You can ONLY recommend books listed in the "STORE INVENTORY" section below.
           - If a book is NOT listed there, you MUST say: "I'm sorry, we don't have that title in stock right now." (Do not hallucinate availability).
        3. **NO OFF-TOPIC:** Refuse questions about news, weather, math, or coding.
        4. **FORMATTING:** Use Markdown. **Bold** titles. Keep it concise.

        ### 📚 STORE INVENTORY (Source of Truth):
        ${inventoryData}
      `
    });

    // --- 4. START CHAT ---
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