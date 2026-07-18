import { Brain, Users, TrendingUp, User } from "lucide-react";

const scores = [
  {
    key: "semanticScore",
    label: "Semantic Match",
    icon: Brain,
    color: "bg-blue-500",
  },
  {
    key: "collaborativeScore",
    label: "Reader Behaviour",
    icon: Users,
    color: "bg-green-500",
  },
  {
    key: "popularityScore",
    label: "Popularity",
    icon: TrendingUp,
    color: "bg-orange-500",
  },
  {
    key: "profileScore",
    label: "Personal Interest",
    icon: User,
    color: "bg-purple-500",
  },
];

export default function RecommendationScoreBreakdown({
  semanticScore = 0,
  collaborativeScore = 0,
  popularityScore = 0,
  profileScore = 0,
}) {
  const values = {
    semanticScore,
    collaborativeScore,
    popularityScore,
    profileScore,
  };

  return (
    <div className="space-y-3">

      <h4 className="text-sm font-semibold text-gray-700">
        Recommendation Analysis
      </h4>

      {scores.map(({ key, label, icon: Icon, color }) => {

        const value = Math.round(values[key] * 100);

        return (
          <div key={key} className="space-y-1">

            <div className="flex justify-between items-center text-xs">

              <div className="flex items-center gap-2">

                <Icon size={14} />

                <span>{label}</span>

              </div>

              <span className="font-semibold">
                {value}%
              </span>

            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

              <div
                className={`${color} h-full rounded-full transition-all duration-700`}
                style={{ width: `${value}%` }}
              />

            </div>

          </div>
        );
      })}
    </div>
  );
}