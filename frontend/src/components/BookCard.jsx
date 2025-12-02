import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-hot-toast";
import RatingStars from "./RatingStars"; 
import { motion } from "framer-motion";

export default function BookCard({ book }) {
  const { user, updateProfile } = useAuth();
  const isOutOfStock = book.stock === 0;

  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === "string" ? item : item._id) === book._id
  );

  async function toggleWishlist(e) {
    e.preventDefault();
    if (!user) return toast.error("Login to save items");
    try {
      const res = await api.put(`/auth/wishlist/${book._id}`);
      updateProfile(res.data.user);
      toast.success(isWishlisted ? "Removed from Wishlist" : "Added to Wishlist");
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  }

  return (
    <motion.div 
      layout
      className={`group relative bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col h-full card-hover backdrop-blur-sm ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[2/3] bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <Link to={`/book/${book._id}`}>
            <img
              src={book.coverImageUrl || "/Placeholder.jpg"}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
        </Link>
        
        <button
          onClick={toggleWishlist}
          className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md transition-all duration-300 z-10 ${isWishlisted ? 'bg-red-50 text-red-500 dark:bg-red-900/50 dark:text-red-400' : 'bg-white/90 dark:bg-slate-900/80 backdrop-blur text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:scale-110'}`}
          title="Wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        
        {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-0 pointer-events-none">
                <span className="bg-white text-slate-900 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-xl transform -rotate-6">
                  Sold Out
                </span>
            </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
           <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
             {book.category}
           </span>
        </div>
        
        <Link to={`/book/${book._id}`} className="block mb-1">
            <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={book.title}>
            {book.title}
            </h3>
        </Link>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-4 font-medium">by {book.author}</p>
        
        <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
                <span className={`text-xl font-bold ${isOutOfStock ? 'text-slate-400 line-through decoration-red-500/50' : 'text-slate-900 dark:text-slate-100'}`}>
                  ₹{book.price}
                </span>
            </div>
            
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{book.rating || 0}</span>
            </div>
        </div>
      </div>
    </motion.div>
  );
}