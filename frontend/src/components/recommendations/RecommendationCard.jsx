import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  IndianRupee,
  Heart,
  ShoppingCart,
  Flame,
  Award,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { syncCart } from "../../utils/cart";

import MatchBadge from "./MatchBadge";
import RecommendationReasons from "./RecommendationReasons";
import RecommendationScoreBreakdown from "./RecommendationScoreBreakdown";

export default function RecommendationCard({ recommendation }) {
  const { user } = useAuth();

  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const {
    _id,
    title,
    author,
    coverImageUrl,
    price,
    rating,
    stock,
    soldCount,
    categories,
    numReviews,
    matchScore,
    semanticScore,
    collaborativeScore,
    popularityScore,
    profileScore,
    reasons,
  } = recommendation;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setWishlisted((prev) => !prev);

    const action = wishlisted ? "REMOVE_WISHLIST" : "WISHLIST";

    trackInteraction(_id, action, {
      source: "recommendation",
    });

    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    if (adding) return;

    setAdding(true);

    try {
      const cartKey = user ? `cart_${user._id}` : "cart_guest";

      const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

      const existing = cart.find((item) => item.bookId === _id);

      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({
          bookId: _id,
          title,
          price,
          coverImageUrl,
          qty: 1,
        });
      }

      localStorage.setItem(cartKey, JSON.stringify(cart));

      if (user) {
        syncCart(user._id, cart);
      }

      toast.success(`${title} added to cart`);
      trackInteraction(_id, "ADD_CART", {
        source: "recommendation",
      });
    } catch (err) {
      console.error(err);
      toast.error("Unable to add to cart");
    } finally {
      setAdding(false);
    }
  }

  const trending = popularityScore >= 0.9;
  const bestseller = soldCount >= 50 || (rating >= 4.7 && numReviews >= 10);

  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{
        duration: 0.25,
      }}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl overflow-hidden"
    >
      {/* Wishlist */}

      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-20 bg-white rounded-full p-2 shadow hover:scale-110 transition"
      >
        <Heart
          size={18}
          color={wishlisted ? "#ef4444" : "#555"}
          fill={wishlisted ? "#ef4444" : "none"}
        />
      </button>

      {/* Cart */}

      <button
        onClick={handleAddToCart}
        disabled={adding || stock === 0}
        className={`absolute top-3 left-3 z-20 rounded-full p-2 shadow transition
${stock === 0 ? "bg-gray-200 cursor-not-allowed" : "bg-white hover:scale-110"}`}
      >
        <ShoppingCart size={18} />
      </button>

      {/* Ribbon */}

      <div className="absolute top-16 left-3 z-20 flex flex-col gap-2">
        {trending && (
          <span className="flex items-center gap-1 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            <Flame size={12} />
            Trending
          </span>
        )}

        {bestseller && (
          <span className="flex items-center gap-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
            <Award size={12} />
            Bestseller
          </span>
        )}
      </div>

      {/* Image */}

      <Link
        to={`/book/${_id}`}
        onClick={() =>
          trackInteraction(_id, "CLICK", {
            source: "recommendation",
          })
        }
      >
        <div className="overflow-hidden">
          <img
            src={coverImageUrl || "https://placehold.co/300x450?text=No+Cover"}
            alt={title}
            className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = "https://placehold.co/300x450?text=No+Cover";
            }}
          />
        </div>
      </Link>

      {/* Body */}

      <div className="flex flex-col flex-1 p-4 space-y-4">
        <MatchBadge score={matchScore} />

        <Link
          to={`/book/${_id}`}
          className="font-bold text-lg hover:text-blue-600 line-clamp-2"
        >
          {title}
        </Link>

        <p className="text-sm text-gray-500 line-clamp-1">{author}</p>

        {/* Stock */}

        <div>
          {stock > 10 && (
            <span className="text-green-600 text-sm font-medium">
              ● In Stock
            </span>
          )}

          {stock > 0 && stock <= 10 && (
            <span className="text-yellow-600 text-sm font-medium">
              ● Only {stock} Left
            </span>
          )}

          {stock === 0 && (
            <span className="text-red-600 text-sm font-medium">
              ● Out of Stock
            </span>
          )}
        </div>

        <RecommendationReasons reasons={reasons} />

        <details>
          <summary className="cursor-pointer text-sm text-blue-600 font-medium">
            View Recommendation Analysis
          </summary>

          <div className="mt-3">
            <RecommendationScoreBreakdown
              semanticScore={semanticScore}
              collaborativeScore={collaborativeScore}
              popularityScore={popularityScore}
              profileScore={profileScore}
            />
          </div>
        </details>

        {/* Categories */}

        <div className="flex flex-wrap gap-2">
          {Array.isArray(categories) &&
            categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {category}
              </span>
            ))}
        </div>

        {/* Bottom */}

        <div className="mt-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={16} fill="currentColor" />
              <span className="text-gray-700">
                {rating ? rating.toFixed(1) : "New"}
              </span>
            </div>
            <div className="text-right">
              <div className="flex items-center font-bold text-blue-600">
                ₹{price.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <Link
            to={`/book/${_id}`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
