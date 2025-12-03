const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { message, context, history } = req.body; 
    
    // --- 1. RAG: Search Inventory First ---
    let inventoryContext = "";
    
    try {
      const keywords = message.split(' ').filter(w => w.length > 2);
      let books = [];

      if (keywords.length > 0) {
        // Specific Search
        const regexQueries = keywords.map(k => ({ 
          $or: [
            { title: { $regex: k, $options: 'i' } },
            { category: { $regex: k, $options: 'i' } },
            { author: { $regex: k, $options: 'i' } }
          ]
        }));
        books = await Book.find({ $or: regexQueries }).limit(5).select('title author price stock category description');
      }

      // FALLBACK: If "Hi", "Recommend me", or "Empty Search" -> Show Bestsellers
      if (books.length === 0) {
         books = await Book.find().sort({ soldCount: -1 }).limit(5).select('title author price stock category description');
         inventoryContext += "NOTE: User query was generic or yielded no results. These are our BESTSELLERS:\n";
      }

      inventoryContext += books.map(b => 
        `- **${b.title}** by ${b.author} (₹${b.price})\n  *${b.stock > 0 ? 'In Stock' : 'Out of Stock'}* - ${b.description.substring(0, 100)}...`
      ).join('\n\n');

    } catch (err) {
      console.error("RAG Error", err);
    }

    const inventoryData = inventoryContext || "NO BOOKS FOUND.";
    const currentBookContext = context 
      ? `User is viewing: **${context.title}** by ${context.author}.` 
      : "User is browsing.";

    // --- 2. FORMAT HISTORY FOR GEMINI ---
    // Gemini expects { role: 'user' | 'model', parts: [{ text: ... }] }
    let formattedHistory = (history || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model', 
        parts: [{ text: msg.text }]
    }));

    // --- FIX: SANITIZE HISTORY ---
    // Gemini crashes if history starts with 'model'. 
    // We must remove the initial "Hi! I'm your assistant" message if it's at the start.
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
    }

    // --- 3. SYSTEM PROMPT ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `
        You are the Inventory Manager for "BookShop". 
        
        ### 🧠 MEMORY RULES:
        - You MUST remember previous recommendations. If the user says "price of *that* book", look at the chat history to see which book was discussed.
        
        ### 🚫 REFUSAL PROTOCOL:
        - Refuse: News, Politics, Math, Coding, General Facts ("Who is CEO of Google?").
        - Reply: "I can only assist with books in our inventory."

        ### ✅ INVENTORY RULES:
        - Recommend books ONLY from the "STORE INVENTORY" list below.
        - If the user asks for a specific book (e.g. "Geography") and it is NOT in the list, apologize and say it's out of stock.
        - Use Markdown (bold titles). Keep it short.

        ### 📚 STORE INVENTORY (Source of Truth):
        ${inventoryData}
      `
    });

    // --- 4. START CHAT WITH HISTORY ---
    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(`CONTEXT: ${currentBookContext}\nUSER QUESTION: ${message}`);
    const aiReply = result.response.text();

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ reply: "I'm having trouble accessing the catalogue. Please try again." });
  }
});

module.exports = router;