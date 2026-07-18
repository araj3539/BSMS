import api from "./api";

class RecommendationService {
    async getBookRecommendations(bookId) {
        const { data } = await api.get(
            `/recommendation/book/${bookId}`
        );

        return data;
    }

    async getHomeRecommendations() {
        const { data } = await api.get(
            "/recommendation/home"
        );

        return data;
    }

    async getPopularBooks(limit = 10) {
        const { data } = await api.get(
            `/recommendation/popular?limit=${limit}`
        );

        return data;
    }

    async searchRecommendations(query) {
        const { data } = await api.get(
            "/recommendation/search",
            {
                params: {
                    q: query,
                },
            }
        );

        return data;
    }

    async getFrequentlyBought(bookId) {
        const { data } = await api.get(
            `/recommendation/book/${bookId}/frequently-bought`
        );

        return data;
    }
}

export default new RecommendationService();