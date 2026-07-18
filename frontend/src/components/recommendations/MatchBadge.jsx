export default function MatchBadge({ score }) {
  let bgColor = "";
  let textColor = "";
  let label = "";

  if (score >= 90) {
    bgColor = "bg-green-100";
    textColor = "text-green-700";
    label = "Excellent Match";
  } else if (score >= 75) {
    bgColor = "bg-blue-100";
    textColor = "text-blue-700";
    label = "Great Match";
  } else if (score >= 60) {
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-700";
    label = "Good Match";
  } else {
    bgColor = "bg-gray-100";
    textColor = "text-gray-700";
    label = "Similar Book";
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bgColor} ${textColor}`}
    >
      <span className="font-semibold">{score}%</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}