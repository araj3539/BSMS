const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiProvider {
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    this.model = this.client.getGenerativeModel({
      model: "gemini-embedding-2",
    });
  }

  async embed(text) {
    const result = await this.model.embedContent({
      content: {
        parts: [
          {
            text,
          },
        ],
      },

      outputDimensionality: 768,
    });

    return result.embedding.values;
  }
}

module.exports = new GeminiProvider();
