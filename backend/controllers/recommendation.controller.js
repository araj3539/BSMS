import { GoogleGenerativeAI } from "@google/generative-ai";
import Book from "../models/Book.js";
import Order from "../models/Order.js"; // Import your Order model

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null; // Extracted from your auth middleware

    const currentBook = await Book.findById(id);
    if (!currentBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // 1. Fetch available inventory
    const catalog = await Book.find({
      _id: { $ne: id },
      stock: { $gt: 0 },
    }).select("_id title author category tags");

    // 2. Fetch User's Purchase History (if logged in)
    let purchaseHistoryContext =
      "The user is browsing anonymously. No past purchase history available.";

    if (userId) {
      const pastOrders = await Order.find({ userId }).select(
        "items.title items.price",
      );
      if (pastOrders.length > 0) {
        // Extract just the titles to keep the prompt lightweight
        const purchasedTitles = pastOrders.flatMap((order) =>
          order.items.map((item) => item.title),
        );
        // Deduplicate titles
        const uniquePurchases = [...new Set(purchasedTitles)];
        purchaseHistoryContext = `The user's past purchase history includes these titles: ${uniquePurchases.join(", ")}. Factor this into their preferences.`;
      } else {
        purchaseHistoryContext =
          "The user has an account but has not made any purchases yet.";
      }
    }

    // 3. Construct the aggressive personalization prompt
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

    // 4. Execute Gemini Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("--- GEMINI PROMPT ---");
    console.log(prompt);
    console.log("---------------------");

    const result = await model.generateContent(prompt);
    const result = await model.generateContent(prompt);

    // 5. Sanitize and Parse
    const responseText = result.response
      .text()
      .trim()
      .replace(/```json/g, "")
      .replace(/```/g, "");
    const recommendedIds = JSON.parse(responseText);

    // 6. Fetch full book objects
    const recommendations = await Book.find({ _id: { $in: recommendedIds } });

    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    res
      .status(500)
      .json({ message: "Failed to generate personalized recommendations." });
  }
};
