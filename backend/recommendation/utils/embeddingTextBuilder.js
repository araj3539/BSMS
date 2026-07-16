function cleanArray(arr = []) {
    return arr
        .filter(Boolean)
        .map(x => x.trim())
        .join("\n");
}

function buildEmbeddingText(book) {

    return `
BOOK

Title:
${book.title}

Authors:
${cleanArray(book.authors)}

Categories:
${cleanArray(book.categories)}

Description:
${book.description || ""}
`;

}

module.exports = {
    buildEmbeddingText
};