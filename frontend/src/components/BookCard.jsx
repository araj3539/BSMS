import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-hot-toast";
import RatingStars from "./RatingStars"; 
import { motion } from "framer-motion";

export default function BookCard({ book }) {
  const { user, updateProfile } = useAuth();
  const isOutOfStock = book.stock === 0; // Check stock status

  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === "string" ? item : item._id) === book._id
  );

  async function toggleWishlist(e) {
    e.preventDefault();
    if (!user) return toast.error("Login to save items");
    try {
      const res = await api.put(`/auth/wishlist/${book._id}`);
      updateProfile(res.data.user);
      toast.success(isWishlisted ? "Removed" : "Saved");
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col h-full ${isOutOfStock ? 'opacity-75' : ''}`}
    >
      
      {/* Image Container */}
      <div className="relative w-full aspect-[2/3] bg-slate-100 overflow-hidden">
        <Link to={`/book/${book._id}`}>
            <img
              src={book.coverImageUrl || "/Placeholder.jpg"}
              alt={book.title}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale filter' : ''}`}
              loading="lazy" // <--- Modern: Native Lazy Loading
            />
        </Link>
        
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-white text-slate-400 hover:text-red-500 transition-colors z-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "#ef4444" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        
        {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-0 pointer-events-none">
                <span className="bg-slate-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-lg transform -rotate-12 border border-white/20">
                  Out of Stock
                </span>
            </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
           <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide truncate">{book.category}</p>
        </div>
        <Link to={`/book/${book._id}`} className="block">
            <h3 className="font-serif text-lg font-bold text-slate-900 leading-tight mb-1 truncate" title={book.title}>
            {book.title}
            </h3>
        </Link>
        <p className="text-sm text-slate-500 truncate mb-3">by {book.author}</p>
        
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-slate-50">
            <div>
                <div className={`text-lg font-bold ${isOutOfStock ? 'text-slate-400 line-through decoration-red-500/50' : 'text-slate-900'}`}>₹{book.price}</div>
                {isOutOfStock && <div className="text-xs text-red-500 font-bold mt-0.5">Sold Out</div>}
            </div>
            <div className="scale-75 origin-right">
                <RatingStars rating={book.rating} />
            </div>
        </div>
      </div>
    </motion.div>
  );
}