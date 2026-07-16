require("dotenv").config();

const mongoose = require("mongoose");

const Book = require("../models/Book");
const embeddingService = require("../recommendation/services/embedding.service");

const BATCH_SIZE = 10;
const DELAY_MS = 1500;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("✅ Mongo Connected");
}

function parseAuthors(author = "") {
  if (!author) return [];

  return [
    ...new Set(
      author
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    ),
  ];
}

function parseCategories(category = "") {
  if (!category) return [];

  try {
    const parsed = JSON.parse(category.replace(/'/g, '"'));

    return [...new Set(parsed.map((c) => String(c).trim()).filter(Boolean))];
  } catch {
    return [
      ...new Set(
        category
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((c) => c.replace(/'/g, "").trim())
          .filter(Boolean),
      ),
    ];
  }
}

async function migrateBook(book) {
  try {
    const authors = parseAuthors(book.author);

    const categories = parseCategories(book.category);

    const embedding = await embeddingService.generateEmbedding({
      ...book.toObject(),

      authors,

      categories,
    });

    await Book.updateOne(
      {
        _id: book._id,
      },

      {
        $set: {
          authors,

          categories,

          embedding,

          embeddingVersion: 2,

          embeddingMetadata: {
            provider: "gemini-embedding-2",

            version: 2,

            generatedAt: new Date(),

            dimensions: embedding.length,
          },
        },
      },
    );

    return {
      success: true,

      title: book.title,
    };
  } catch (err) {
    return {
      success: false,

      title: book.title,

      error: err.message,
    };
  }
}

async function migrate() {
  await connectDB();

  const books = await Book.find();

  console.log(`\nFound ${books.length} books\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);

    console.log(
      `\n========== Batch ${Math.floor(i / BATCH_SIZE) + 1} ==========\n`,
    );

    for (const book of batch) {
      if (
        book.embedding &&
        book.embedding.length === 768 &&
        book.embeddingVersion === 2
      ) {
        skipped++;

        console.log(`⏭ ${book.title}`);

        continue;
      }

      const result = await migrateBook(book);

      if (result.success) {
        success++;

        console.log(`✅ ${result.title}`);
      } else {
        failed++;

        console.log(`❌ ${result.title}`);

        console.log(result.error);
      }
    }

    console.log(
      `Progress : ${Math.min(i + BATCH_SIZE, books.length)}/${books.length}`,
    );

    if (i + BATCH_SIZE < books.length) {
      console.log(`Sleeping ${DELAY_MS / 1000}s...\n`);

      await sleep(DELAY_MS);
    }
  }

  console.log("\n==============================");

  console.log("Migration Finished");

  console.log("==============================");

  console.log({
    success,

    failed,

    skipped,
  });

  process.exit();
}

migrate();
