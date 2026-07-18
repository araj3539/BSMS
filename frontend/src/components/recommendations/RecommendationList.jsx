import { useEffect, useState } from "react";
import recommendationService from "../../services/recommendation.service";
import RecommendationCard from "./RecommendationCard";
import RecommendationSkeleton from "./RecommendationSkeleton";
import EmptyRecommendations from "./EmptyRecommendations";

export default function RecommendationList({ bookId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bookId) {
      loadRecommendations();
    }
  }, [bookId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      setError(null);

      const response =
        await recommendationService.getBookRecommendations(bookId);

      const transformed = (response.recommendations || []).map((item) => ({
        ...item.book,

        matchScore: Math.round(item.finalScore * 100),

        semanticScore: item.semanticScore,

        collaborativeScore: item.collaborativeScore,

        popularityScore: item.popularityScore,

        profileScore: item.profileScore,

        reasons: item.reasons || [],
      }));

      console.log("Response", response);

      console.log("Transformed", transformed);
      setRecommendations(transformed);
    } catch (err) {
      console.error(err);

      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <RecommendationSkeleton />;

  if (error) return null;

  if (!recommendations.length) return <EmptyRecommendations />;

  return (
    <div>
      {recommendations.map((book) => (
        <RecommendationCard key={book._id} recommendation={book} />
      ))}
    </div>
  );
}
