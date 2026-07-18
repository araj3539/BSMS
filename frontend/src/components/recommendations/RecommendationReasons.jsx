import { Sparkles } from "lucide-react";

export default function RecommendationReasons({ reasons = [] }) {
  if (!reasons.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
        <Sparkles size={16} />
        <span>Why Recommended</span>
      </div>

      <ul className="space-y-1">
        {reasons.map((reason, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <span className="text-green-600 font-bold">✓</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}