const express = require('express');
const router = express.Router();
const axios = require('axios');
const Book = require('../models/Book');

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body; // 'context' is the book the user is currently looking at
    
    // 1. RAG: Search our own DB for relevant books based on the user's query
    // This effectively "grounds" the AI in your actual inventory.
    let inventoryContext = "";
    try {
      // Simple keyword extraction (naive approach)
      const keywords = message.split(' ').filter(w => w.length > 4); 
      
      const regexQueries = keywords.map(k => ({ 
        $or: [
          { title: { $regex: k, $options: 'i' } },
          { description: { $regex: k, $options: 'i' } },
          { category: { $regex: k, $options: 'i' } }
        ]
      }));

      // Find up to 5 matching books
      let books = [];
      if(regexQueries.length > 0) {
         books = await Book.find({ $or: regexQueries }).limit(5).select('title author price stock category');
      }

      // Format inventory for the AI
      if (books.length > 0) {
        inventoryContext = "RELEVANT BOOKS IN STOCK:\n" + books.map(b => 
          `- "${b.title}" by ${b.author} (₹${b.price}, ${b.stock > 0 ? 'In Stock' : 'Out of Stock'})`
        ).join('\n');
      } else {
        inventoryContext = "No specific books found in stock matching keywords.";
      }

    } catch (err) {
      console.error("RAG Search Error", err);
    }

    // 2. Construct the System Prompt
    const systemPrompt = `
      You are the intelligent assistant for "BookShop", a premium online bookstore.
      
      YOUR GOAL: Help the customer find the perfect book, explain concepts, or assist with their shopping.
      
      CONTEXT:
      ${context ? `The user is currently viewing: "${context.title}" by ${context.author}.` : "The user is browsing the store."}
      
      INVENTORY DATA (Use this to make recommendations):
      ${inventoryContext}
      
      RULES:
      1. Only recommend books listed in the INVENTORY DATA. If a book isn't there, say you don't have it but suggest a similar one from the list if possible.
      2. Be concise, friendly, and professional.
      3. If asked about prices, strictly use the provided data.
      4. If the user asks a general literary question (e.g., "themes of 1984"), answer it using your general knowledge.
    `;

    // 3. Call Perplexity API
    const response = await axios.post(PERPLEXITY_API_URL, {
      model: "llama-3.1-sonar-small-128k-online", // Or "sonar-medium-online"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
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
    res.status(500).json({ msg: "My brain is fuzzy right now. Try again later!" });
  }
});

module.exports = router;