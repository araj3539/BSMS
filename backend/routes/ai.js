const express = require('express');
const router = express.Router();
const axios = require('axios');
const Book = require('../models/Book');

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body; 
    
    // --- 1. RAG: Search Inventory First ---
    let inventoryContext = "No specific books found in stock matching keywords.";
    
    try {
      // Create a broad search from the user's message
      const keywords = message.split(' ').filter(w => w.length > 3); // Filter short words
      
      if (keywords.length > 0) {
        const regexQueries = keywords.map(k => ({ 
          $or: [
            { title: { $regex: k, $options: 'i' } },
            { description: { $regex: k, $options: 'i' } },
            { category: { $regex: k, $options: 'i' } },
            { author: { $regex: k, $options: 'i' } }
          ]
        }));

        // Fetch up to 8 relevant books from YOUR database
        const books = await Book.find({ $or: regexQueries }).limit(8).select('title author price stock category description');

        if (books.length > 0) {
          inventoryContext = books.map(b => 
            `- TITLE: "${b.title}"\n  AUTHOR: ${b.author}\n  PRICE: ₹${b.price}\n  STATUS: ${b.stock > 0 ? 'In Stock' : 'Out of Stock'}\n  SUMMARY: ${b.description.substring(0, 100)}...`
          ).join('\n\n');
        }
      }
    } catch (err) {
      console.error("RAG Search Error", err);
    }

    // --- 2. Strict System Prompt ---
    const systemPrompt = `
      You are the specialized AI Sales Assistant for "BookShop". You are NOT a general chatbot.

      ### YOUR RULES (FOLLOW STRICTLY):
      1. **SCOPE RESTRICTION:** You ONLY answer questions about books, authors, and shopping at this store. 
         - If the user asks about the weather, math, coding, or general life advice, politely refuse: "I can only assist you with books and our store inventory."
      
      2. **INVENTORY TRUTH:** - The "STORE INVENTORY" section below contains the *only* books you know exist.
         - **NEVER** recommend a book that is not in the "STORE INVENTORY" list. 
         - If the user asks for a book not in the list, say: "I'm sorry, we don't have that in stock right now," and suggest a relevant alternative from the list if possible.

      3. **GREETINGS:** - If the user says "hi", "hello", or "hey", reply as a shopkeeper: "Welcome to BookShop! Are you looking for a specific genre, or would you like a recommendation from our collection?"

      4. **TONE:** Professional, helpful, and concise. Keep answers short (under 3 sentences unless asked for a summary).

      5.**FORMATTING:** Use Markdown. Use **bold** for book titles and prices. Use lists (-) for recommendations.

      ### CURRENT CONTEXT:
      ${context ? `The user is currently looking at the product page for: "${context.title}" by ${context.author}. Focus on this book if asked details.` : "The user is browsing the home page."}

      ### STORE INVENTORY (The only books you sell):
      ${inventoryContext}
    `;

    // --- 3. Call Perplexity API (Sonar) ---
    const response = await axios.post(PERPLEXITY_API_URL, {
      model: "sonar-reasoning", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.1 // Low temperature = strictly follow facts/inventory
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiReply = response.data.choices[0].message.content;
    res.json({ reply: aiReply });

  } catch (error) {
    console.error("AI Error:", error.response?.data || error.message);
    // Graceful fallback if API fails
    res.status(500).json({ reply: "I'm having trouble checking the shelves right now. Please browse our catalog manually!" });
  }
});

module.exports = router;