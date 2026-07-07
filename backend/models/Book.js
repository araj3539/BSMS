// backend/models/Book.js
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  comment: { type: String, required: true },
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, // <--- NEW FIELD
  replies: [ReplySchema]
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String },
  isbn: { type: String },
  description: { type: String },
  coverImageUrl: { type: String },
  ebookUrl: { type: String },
  audiobookUrl: { type: String },
  soldCount: { type: Number, default: 0 },

  reviews: [ReviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
  
  // Your new vector field
  embedding: { type: [Number], select: false } 
}, {
  timestamps: true
});

BookSchema.pre('save', async function(next) {
  // OPTIMIZATION: Only generate a new vector if the text content actually changed.
  // We don't want to waste API calls if the admin just updated the 'price' or 'stock'.
  if (
    this.isModified('title') || 
    this.isModified('author') || 
    this.isModified('category') || 
    this.isModified('description')
  ) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      
      const textToEmbed = `Title: ${this.title}. Author: ${this.author}. Category: ${this.category}. Description: ${this.description}`;
      
      const result = await model.embedContent({
        content: { parts: [{ text: textToEmbed }] },
        outputDimensionality: 768
      });
      
      // Attach the generated vector to the document before it saves
      this.embedding = result.embedding.values;
      
    } catch (error) {
      console.error(`Failed to generate embedding for ${this.title}:`, error);
      // We log the error but allow the book to save anyway so the store doesn't break
    }
  }
  
  next(); // Tell Mongoose to continue saving to the database
});

module.exports = mongoose.model('Book', BookSchema);