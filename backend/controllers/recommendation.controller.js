const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');
const Order = require('../models/Order'); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null; 

    const currentBook = await Book.findById(id);
    if (!currentBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    const catalog = await Book.find({ _id: { $ne: id }, stock: { $gt: 0 } })
                              .select('_id title author category tags');

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

    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    res.status(500).json({ message: "Failed to generate personalized recommendations." });
  }
};