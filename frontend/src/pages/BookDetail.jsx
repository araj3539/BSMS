import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import RecommendationList from "../components/RecommendationList";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";
import RatingStars from "../components/RatingStars";
import SkeletonBookDetail from "../components/SkeletonBookDetail"; // <--- Import Skeleton
import { syncCart } from '../utils/cart';
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function BookDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true); // Added Loading State

  useEffect(() => { 
    window.scrollTo(0, 0);
    setLoading(true); // Start loading
    fetchBook(); 
  }, [id]);

  async function fetchBook() {
    try {
      const r = await api.get("/books/" + id);
      setBook(r.data);
    } catch (err) { 
      console.error(err); 
      toast.error("Failed to load book details");
    } finally {
      // Add a small artificial delay for smoothness (optional)
      // setTimeout(() => setLoading(false), 300); 
      setLoading(false);
    }
  }

  async function addToCart() {
    setAdding(true);
    await new Promise(r => setTimeout(r, 500));

    const cartKey = user ? `cart_${user._id}` : 'cart_guest';
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const existing = cart.find((ci) => ci.bookId === book._id);
    
    if (existing) existing.qty += qty;
    else cart.push({ bookId: book._id, title: book.title, price: book.price, coverImageUrl: book.coverImageUrl, qty });
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
    if (user) syncCart(user._id, cart);
    
    toast.success(`${book.title} added to cart!`);
    setAdding(false);
  }

  function updateQty(val) {
    if (!book) return;
    setQty(Math.max(1, Math.min(book.stock, Math.floor(val))));
  }

  // --- FIX: USE SKELETON INSTEAD OF SPINNER ---
  if (loading || !book) return <SkeletonBookDetail />;
  
  const isOutOfStock = book.stock === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* --- BREADCRUMB --- */}
      <div className="container mx-auto px-6 py-6">
        <Link to="/" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2">
          &larr; Back to Browse
        </Link>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
          
          {/* Decorative Gradient Blob */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

          <div className="flex flex-col md:flex-row">
            
            {/* LEFT: Image */}
            <div className="w-full md:w-5/12 lg:w-1/3 bg-slate-50 p-8 flex items-center justify-center relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative shadow-2xl rounded-lg overflow-hidden max-w-[280px] w-full aspect-[2/3]"
              >
                <img
                  src={book.coverImageUrl || "/Placeholder.jpg"}
                  alt={book.title}
                  className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-80' : ''}`}
                />
                {isOutOfStock && (
                   <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-slate-900 text-white px-6 py-2 text-sm font-bold uppercase tracking-widest shadow-xl transform -rotate-12 border border-white/20">
                        Out of Stock
                      </span>
                   </div>
                )}
              </motion.div>
            </div>

            {/* RIGHT: Details */}
            <div className="flex-1 p-8 lg:p-12 relative z-10">
              <div className="flex flex-col h-full justify-center">
                <div className="mb-4">
                   <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-100">
                      {book.category}
                   </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-slate-500 font-medium mb-6">by <span className="text-slate-800">{book.author}</span></p>

                <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
                      <RatingStars rating={book.rating || 0} />
                      <span className="text-sm text-yellow-700 font-bold ml-1 pt-0.5">{book.rating ? book.rating.toFixed(1) : 0}</span>
                  </div>
                  <a href="#reviews" className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors underline decoration-slate-200 hover:decoration-indigo-600 underline-offset-4">
                    Read {book.numReviews} Reviews
                  </a>
                </div>

                <div className="prose prose-slate text-slate-600 leading-relaxed mb-8 max-w-none">
                  <p>{book.description}</p>
                </div>

                {/* Pricing & Action */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mt-auto">
                  <div>
                      <div className="text-4xl font-bold text-slate-900 tracking-tight">₹{book.price}</div>
                      <div className={`text-xs mt-1 font-bold uppercase tracking-wide ${book.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {book.stock > 0 ? `In Stock (${book.stock} copies)` : "Currently Unavailable"}
                      </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1 justify-end">
                      {/* Quantity */}
                      <div className={`flex items-center border border-slate-200 rounded-xl bg-slate-50 h-12 ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                          <button onClick={() => updateQty(qty - 1)} disabled={qty <= 1} className="w-10 h-full text-slate-500 hover:text-slate-800 hover:bg-white rounded-l-xl transition-colors text-lg">-</button>
                          <div className="w-10 text-center font-bold text-slate-900">{qty}</div>
                          <button onClick={() => updateQty(qty + 1)} disabled={qty >= book.stock} className="w-10 h-full text-slate-500 hover:text-slate-800 hover:bg-white rounded-r-xl transition-colors text-lg">+</button>
                      </div>
                      
                      {/* Button */}
                      <button
                          onClick={addToCart}
                          disabled={isOutOfStock || adding}
                          className={`flex-1 sm:flex-none h-12 px-8 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-indigo-600 hover:shadow-indigo-500/30'}`}
                      >
                          {adding ? <div className="loader w-5 h-5 border-white/30 border-t-white"></div> : (isOutOfStock ? 'Sold Out' : 'Add to Cart')}
                      </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- REVIEWS & RECS GRID --- */}
        <div className="mt-16 grid lg:grid-cols-12 gap-12">
          
          {/* Reviews Column */}
          <div className="lg:col-span-8" id="reviews">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-bold text-slate-900">Community Reviews</h3>
                {user && <button onClick={() => document.getElementById('review-form')?.scrollIntoView({behavior: 'smooth'})} className="text-sm font-bold text-indigo-600 hover:underline">Write a Review</button>}
              </div>
              
              <div className="space-y-8">
                <ReviewList reviews={book.reviews} user={user} bookId={book._id} onUpdate={fetchBook} />
                
                <div id="review-form" className="scroll-mt-24">
                   {user ? (
                     <ReviewForm bookId={book._id} onReviewAdded={fetchBook} />
                   ) : (
                     <div className="bg-slate-100 p-8 rounded-2xl text-center border border-slate-200">
                        <p className="text-slate-600 mb-4">Sign in to share your thoughts on this book.</p>
                        <Link to="/login" className="inline-block bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-full font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all">Login to Review</Link>
                     </div>
                   )}
                </div>
              </div>
          </div>

          {/* Recommendations Column */}
          <div className="lg:col-span-4">
              <div className="sticky top-24">
                 <RecommendationList bookId={book._id} />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}