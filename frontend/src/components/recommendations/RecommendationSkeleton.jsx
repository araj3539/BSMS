import { motion } from "framer-motion";

function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Image */}
      <div className="w-full h-64 bg-gray-200" />

      <div className="p-4 space-y-3">

        {/* Match Badge */}
        <div className="w-28 h-6 rounded-full bg-gray-200" />

        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-full" />
          <div className="h-5 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Author */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />

        {/* Recommendation Reasons */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
          <div className="h-3 bg-gray-200 rounded w-3/6" />
        </div>

        {/* Categories */}
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-gray-200" />
          <div className="h-6 w-20 rounded-full bg-gray-200" />
        </div>

        {/* Rating + Price */}
        <div className="flex justify-between">
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-5 w-20 rounded bg-gray-200" />
        </div>

        {/* Button */}
        <div className="h-10 rounded-lg bg-gray-200" />
      </div>
    </motion.div>
  );
}

export default function RecommendationSkeleton() {
  return (
    <section className="mt-10">
      <div className="h-8 w-56 bg-gray-200 rounded mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </section>
  );
}