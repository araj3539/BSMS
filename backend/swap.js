// backend/swapToHtml.js
require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');

async function swapLinks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Finding EPUB links...');

    const books = await Book.find({ ebookUrl: { $regex: 'epub' } });
    
    let updatedCount = 0;
    for (let book of books) {
      // Replaces ".epub3.images" or ".epub.images" with ".html.images"
      book.ebookUrl = book.ebookUrl.replace(/epub\d?\.images/g, 'html.images');
      await book.save();
      updatedCount++;
    }

    console.log(`✅ Success! Converted ${updatedCount} links to HTML format.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

swapLinks();