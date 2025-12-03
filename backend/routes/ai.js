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
      // 1. Extract keywords (filtering out small words)
      const keywords = message.split(' ').filter(w => w.length > 3);
      
      if (keywords.length > 0) {
        // 2. Build a MongoDB query
        const regexQueries = keywords.map(k => ({ 
          $or: [
            { title: { $regex: k, $options: 'i' } },
            { description: { $regex: k, $options: 'i' } },
            { category: { $regex: k, $options: 'i' } },
            { author: { $regex: k, $options: 'i' } }
          ]
        }));

        // 3. Fetch RELEVANT books only
        const books = await Book.find({ $or: regexQueries }).limit(8).select('title author price stock category description');

        if (books.length > 0) {
          inventoryContext = books.map(b => 
            `- **${b.title}** by ${b.author} (₹${b.price})\n  *${b.stock > 0 ? 'In Stock' : 'Out of Stock'}* - ${b.description.substring(0, 120)}...`
          ).join('\n\n');
        }
      }
    } catch (err) {
      console.error("RAG Search Error", err);
    }

    // --- 2. THE STRICT SYSTEM PROMPT ---
    const systemPrompt = `
      You are the dedicated Inventory Manager for "BookShop". 
      You are NOT a general purpose AI. You do NOT have access to the internet, news, or general knowledge.

      ### 🚫 STRICT REFUSAL PROTOCOL (MUST FOLLOW):
      If the user asks about:
      - **News / Current Events** (e.g., "today's news", "who won the game")
      - **General Facts** (e.g., "capital of France", "what is AI", "define love")
      - **Personal Questions** (e.g., "what is your name", "how do you work")
      - **Math / Coding**
      
      ...You MUST reply with EXACTLY this phrase (varied slightly):
      "I am designed only to help you explore the BookShop inventory. Would you like a book recommendation?"

      ### ✅ ALLOWED ACTIONS:
      1. Recommend books ONLY from the "STORE INVENTORY" list below.
      2. Summarize the book provided in the "CURRENT CONTEXT".
      3. Check prices or stock status based ONLY on the data below.

      ### 📚 STORE INVENTORY (The ONLY books you know exist):
      ${inventoryContext}

      ### CURRENT CONTEXT:
      ${context ? `User is viewing: **${context.title}** by ${context.author}.` : "User is browsing the shelves."}
    `;

    // --- 3. Call Perplexity API ---
    const response = await axios.post(PERPLEXITY_API_URL, {
      model: "sonar", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      // Zero temperature forces the model to be as deterministic/robotic as possible
      temperature: 0, 
      // Limit token usage to prevent long rambling news reports
      max_tokens: 250 
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
    res.status(500).json({ reply: "I'm having trouble checking the shelves right now. Please browse our catalog manually!" });
  }
});

module.exports = router;