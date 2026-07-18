export default function RecommendationCard({ recommendation }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold">{recommendation.title}</h3>
      <p>{recommendation.author}</p>
      <p>{recommendation.matchScore}% Match</p>
    </div>
  );
}