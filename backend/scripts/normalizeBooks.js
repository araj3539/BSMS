require("dotenv").config();

const mongoose = require("mongoose");
const Book = require("../models/Book");

async function normalizeBooks() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB Connected");

        const books = await Book.find().lean();

        console.log(`📚 Found ${books.length} books`);

        let updated = 0;

        for (const book of books) {

            //-----------------------------------
            // Normalize Category
            //-----------------------------------

            let categories = [];

            if (typeof book.category === "string") {

                categories = JSON.parse(
                    book.category.replace(/'/g, '"')
                );

            } else if (Array.isArray(book.category)) {

                categories = book.category;

            }

            categories = categories
                .map(c => c.trim())
                .filter(Boolean);

            //-----------------------------------
            // Normalize Authors
            //-----------------------------------

            let authors = [];

            if (book.author) {

                authors = book.author
                    .split(",")
                    .map(a => a.trim())
                    .filter(Boolean);

            }

            //-----------------------------------
            // IMPORTANT
            // Update ONLY these fields
            //-----------------------------------

            await Book.updateOne(

                { _id: book._id },

                {
                    $set: {

                        category: categories,

                        authors: authors

                    }

                }

            );

            updated++;

            if (updated % 100 === 0) {

                console.log(`Updated ${updated} books`);

            }

        }

        console.log("");

        console.log("================================");

        console.log("Normalization Complete");

        console.log(`Books Updated : ${updated}`);

        process.exit();

    }

    catch (err) {

        console.error(err);

        process.exit(1);

    }

}

normalizeBooks();