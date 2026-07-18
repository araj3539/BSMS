import api from "./api";

export async function trackInteraction(bookId, action, metadata = {}) {
  try {
    await api.post("/recommendation/track", {
      bookId,
      action,
      metadata,
    });
  } catch (err) {
    console.error("Interaction tracking failed:", err);
  }
}