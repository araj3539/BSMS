const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');
const Order = require('../models/Order'); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Initialize a simple in-memory cache
const recommendationCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

exports.getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null; 

    // 2. Check the cache first before making any database or API calls
    const cacheKey = `${id}_${userId || 'guest'}`;
    if (recommendationCache.has(cacheKey)) {
      const cached = recommendationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }
    }

    const currentBook = await Book.findById(id);
    if (!currentBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // 3. Limit the catalog payload. Instead of the whole database, send a maximum of 50 books.
    // You can filter this further by matching the current book's category for even better context.
    const catalog = await Book.find({ _id: { $ne: id }, stock: { $gt: 0 } })
                              .select('_id title author category tags')
                              .limit(50);

    let purchaseHistoryContext = "The user is browsing anonymously. No past purchase history available.";
    
    if (userId) {
      const pastOrders = await Order.find({ userId }).select('items.title items.price');
      if (pastOrders.length > 0) {
        const purchasedTitles = pastOrders.flatMap(order => 
          order.items.map(item => item.title)
        );
        const uniquePurchases = [...new Set(purchasedTitles)];
        purchaseHistoryContext = `The user's past purchase history includes these titles: ${uniquePurchases.join(', ')}. Factor this into their preferences.`;
      } else {
        purchaseHistoryContext = "The user has an account but has not made any purchases yet.";
      }
    }

    const prompt = `
      You are an expert, highly personalized bookstore recommendation engine.
      
      CURRENT CONTEXT:
      The user is currently viewing: "${currentBook.title}" by ${currentBook.author}.
      Category: ${currentBook.category}.
      Description: ${currentBook.description}.

      USER CONTEXT:
      ${purchaseHistoryContext}

      AVAILABLE INVENTORY (JSON):
      ${JSON.stringify(catalog)}

      TASK:
      Select exactly 3 books from the inventory that this specific user is most likely to buy next. 
      Balance their interest in the current book with their demonstrated past purchase preferences.
      
      Return ONLY a raw JSON array of the recommended book _ids. Example: ["id1", "id2", "id3"]. 
      Do not include markdown formatting, explanations, or code blocks.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    const responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '');
    const recommendedIds = JSON.parse(responseText);

    const recommendations = await Book.find({ _id: { $in: recommendedIds } });

    // 4. Save the final result to the cache before sending it to the frontend
    recommendationCache.set(cacheKey, {
      timestamp: Date.now(),
      data: recommendations
    });

    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    res.status(500).json({ message: "Failed to generate personalized recommendations." });
  }
};