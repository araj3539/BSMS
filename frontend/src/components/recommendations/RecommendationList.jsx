import { useEffect, useState } from "react";
import recommendationService from "../../services/recommendation.service";
import RecommendationCard from "./RecommendationCard";
import RecommendationSkeleton from "./RecommendationSkeleton";
import EmptyRecommendations from "./EmptyRecommendations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export default function RecommendationList({ bookId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -350 : 350,
      behavior: "smooth",
    });
  };

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
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recommended Books</h2>

          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border hover:bg-gray-100"
            >
              <ChevronLeft />
            </button>

            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border hover:bg-gray-100"
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {recommendations.length} Recommendations
        </p>
      </div>

      <div
        ref={scrollRef}
        className="
        flex
        gap-6
        overflow-x-auto
        pb-4
        snap-x
        snap-mandatory
        scrollbar-thin
        scrollbar-thumb-gray-300
        scrollbar-track-transparent
      "
      >
        {recommendations.map((book) => (
          <div
            key={book._id}
            className="
            snap-start
            flex-shrink-0
            w-72
          "
          >
            <RecommendationCard recommendation={book} />
          </div>
        ))}
      </div>
    </section>
  );
}
