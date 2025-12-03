const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');

// Initialize Gemini
// Ensure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body; 
    
    // --- 1. RAG: Search Inventory First (Same logic as before) ---
    let inventoryContext = "No specific books found in stock matching keywords.";
    
    try {
      const keywords = message.split(' ').filter(w => w.length > 2);
      if (keywords.length > 0) {
        const regexQueries = keywords.map(k => ({ 
          $or: [
            { title: { $regex: k, $options: 'i' } },
            { description: { $regex: k, $options: 'i' } },
            { category: { $regex: k, $options: 'i' } },
            { author: { $regex: k, $options: 'i' } }
          ]
        }));

        const books = await Book.find({ $or: regexQueries })
          .limit(10)
          .select('title author price stock category description');

        if (books.length > 0) {
          inventoryContext = books.map(b => 
            `- **${b.title}** by ${b.author} (₹${b.price})\n  *${b.stock > 0 ? 'In Stock' : 'Out of Stock'}* - ${b.description.substring(0, 150)}...`
          ).join('\n\n');
        }
      }
    } catch (err) {
      console.error("RAG Search Error", err);
    }

    const inventoryData = inventoryContext || "NO BOOKS FOUND matching the user's query.";
    
    const currentBookContext = context 
      ? `User is viewing: **${context.title}** by ${context.author}.` 
      : "User is browsing.";

    // --- 2. THE GEMINI SYSTEM PROMPT ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Fast and efficient
      systemInstruction: `
        You are the Inventory Manager for "BookShop". 
        You are a database interface, not a chatbot. You DO NOT have access to the internet.

        ### 🚫 REFUSAL PROTOCOL:
        If the user asks about:
        - News, Weather, Sports, Politics
        - General Facts (e.g., "History of France")
        - Math, Coding, or Personal Advice
        
        ...You MUST reply ONLY with:
        "I am designed only to help you explore the BookShop inventory. Would you like a book recommendation?"

        ### ✅ YOUR JOB:
        1. Recommend books ONLY from the "STORE INVENTORY" provided below.
        2. If a book is NOT in the list, apologize and say: "We do not have that specific title in stock."
        3. Use Markdown (bold titles). Keep answers under 3 sentences.

        ### 📚 STORE INVENTORY (Source of Truth):
        ${inventoryData}
      `
    });

    // --- 3. Generate Response ---
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `CONTEXT: ${currentBookContext}\n\nUSER QUESTION: ${message}` }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const aiReply = result.response.text();

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ reply: "I'm having trouble checking the shelves. Please browse our catalog manually!" });
  }
});

module.exports = router;