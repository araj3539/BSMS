import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import RecommendationList from "../components/RecommendationList";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";
import RatingStars from "../components/RatingStars";
import SkeletonBookDetail from "../components/SkeletonBookDetail";
import { syncCart } from '../utils/cart';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function BookDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State for Read More
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => { 
    window.scrollTo(0, 0);
    setLoading(true); 
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

  if (loading || !book) return <SkeletonBookDetail />;
  
  const isOutOfStock = book.stock === 0;
  
  // Description Truncation Logic
  const MAX_DESC_LENGTH = 350;
  const shouldTruncate = book.description && book.description.length > MAX_DESC_LENGTH;
  const displayedDesc = isDescExpanded || !shouldTruncate
    ? book.description
    : book.description.slice(0, MAX_DESC_LENGTH) + "...";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* --- BREADCRUMB & HEADER --- */}
      <div className="sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Browse
          </Link>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="container mx-auto px-4 md:px-6 mt-6 md:mt-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden relative">
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3 opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-50/50 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/4 opacity-60"></div>

          <div className="flex flex-col md:flex-row relative z-10">
            
            {/* LEFT: Image (Sticky on Desktop) */}
            <div className="w-full md:w-5/12 lg:w-4/12 bg-slate-50/50 p-8 md:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-slate-100">
              <div className="sticky top-24">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative group perspective-1000 mx-auto max-w-[280px] md:max-w-full"
                >
                   {/* Book Shadow */}
                   <div className="absolute -inset-1 bg-slate-900/10 blur-xl rounded-lg translate-y-4 scale-95 transition-all duration-500 group-hover:scale-100 group-hover:bg-slate-900/20"></div>
                   
                   <div className="relative rounded-lg overflow-hidden shadow-2xl aspect-[2/3] ring-1 ring-black/5">
                      <img
                        src={book.coverImageUrl || "/Placeholder.jpg"}
                        alt={book.title}
                        className={`w-full h-full object-cover transition-all duration-700 ${isOutOfStock ? 'grayscale opacity-90' : 'group-hover:scale-105'}`}
                      />
                      
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-3 text-lg font-bold uppercase tracking-[0.2em] shadow-2xl transform -rotate-12">
                              Sold Out
                            </div>
                        </div>
                      )}
                   </div>
                </motion.div>
              </div>
            </div>

            {/* RIGHT: Details */}
            <div className="flex-1 p-6 md:p-10 lg:p-14 flex flex-col">
                {/* Category Badge */}
                <div className="mb-4">
                   <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-bold uppercase tracking-wider rounded-full border border-indigo-100 shadow-sm">
                      {book.category}
                   </span>
                </div>

                {/* Title & Author */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-slate-900 leading-[1.1] mb-3 tracking-tight">
                  {book.title}
                </h1>
                <p className="text-lg text-slate-500 font-medium mb-6">
                  by <span className="text-slate-800 underline decoration-slate-200 underline-offset-4">{book.author}</span>
                </p>

                {/* Rating Row */}
                <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1 text-yellow-400 text-lg">
                         <RatingStars rating={book.rating || 0} />
                      </div>
                      <span className="text-base font-bold text-slate-700 pt-0.5">
                        {book.rating ? book.rating.toFixed(1) : "0.0"}
                      </span>
                  </div>
                  <div className="w-px h-5 bg-slate-200"></div>
                  <a href="#reviews" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <span>{book.numReviews}</span> Reviews
                  </a>
                </div>

                {/* Description with Read More */}
                <div className="mb-8 md:mb-10">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">About the Book</h3>
                    <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed max-w-none">
                      <p className="whitespace-pre-line transition-all duration-300">
                        {displayedDesc}
                      </p>
                    </div>
                    
                    {shouldTruncate && (
                      <button 
                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                        className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group focus:outline-none"
                      >
                        {isDescExpanded ? (
                          <>Show Less <span className="group-hover:-translate-y-0.5 transition-transform">↑</span></>
                        ) : (
                          <>Read More <span className="group-hover:translate-y-0.5 transition-transform">↓</span></>
                        )}
                      </button>
                    )}
                </div>

                {/* Price & Cart Action */}
                <div className="mt-auto bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                  
                  <div className="text-center sm:text-left">
                      <div className="text-4xl font-bold text-slate-900 tracking-tighter">₹{book.price}</div>
                      <div className={`text-xs font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5 justify-center sm:justify-start ${book.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          <span className={`w-2 h-2 rounded-full ${book.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                          {book.stock > 0 ? `In Stock` : "Unavailable"}
                      </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Quantity Selector */}
                      <div className={`flex items-center bg-white border border-slate-200 rounded-xl h-12 shadow-sm ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                          <button 
                            onClick={() => updateQty(qty - 1)} 
                            disabled={qty <= 1} 
                            className="w-10 h-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-l-xl transition-colors text-xl font-medium"
                          >−</button>
                          <div className="w-10 text-center font-bold text-slate-900 tabular-nums">{qty}</div>
                          <button 
                            onClick={() => updateQty(qty + 1)} 
                            disabled={qty >= book.stock} 
                            className="w-10 h-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-xl transition-colors text-xl font-medium"
                          >+</button>
                      </div>
                      
                      {/* Add Button */}
                      <button
                          onClick={addToCart}
                          disabled={isOutOfStock || adding}
                          className={`flex-1 sm:flex-none h-12 px-8 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2.5 whitespace-nowrap
                            ${isOutOfStock 
                              ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 shadow-indigo-600/20'}`
                          }
                      >
                          {adding ? (
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                             isOutOfStock ? 'Sold Out' : (
                               <>
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                 Add to Cart
                               </>
                             )
                          )}
                      </button>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* --- REVIEWS & RECOMMENDATIONS GRID --- */}
        <div className="mt-16 grid lg:grid-cols-12 gap-10">
          
          {/* Reviews Column */}
          <div className="lg:col-span-8" id="reviews">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-bold text-slate-900">Community Reviews</h3>
                {user && (
                  <button 
                    onClick={() => document.getElementById('review-form')?.scrollIntoView({behavior: 'smooth'})} 
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-full transition-colors"
                  >
                    + Write a Review
                  </button>
                )}
              </div>
              
              <div className="space-y-10">
                <ReviewList reviews={book.reviews} user={user} bookId={book._id} onUpdate={fetchBook} />
                
                <div id="review-form" className="scroll-mt-32 pt-6 border-t border-slate-200">
                   {user ? (
                     <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-100">
                        <h4 className="text-lg font-bold text-slate-900 mb-4">Leave a Review</h4>
                        <ReviewForm bookId={book._id} onReviewAdded={fetchBook} />
                     </div>
                   ) : (
                     <div className="bg-slate-100 p-8 md:p-10 rounded-3xl text-center border border-slate-200">
                        <div className="text-4xl mb-4">👋</div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Join the conversation</h4>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">Sign in to share your thoughts on <span className="font-semibold text-slate-800">{book.title}</span> with the community.</p>
                        <Link to="/login" className="inline-flex bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 transition-all">
                          Login to Review
                        </Link>
                     </div>
                   )}
                </div>
              </div>
          </div>

          {/* Recommendations Column */}
          <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28 space-y-6">
                 <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="text-xl font-serif font-bold mb-2">Similar Books</h4>
                      <p className="text-indigo-200 text-sm mb-4">Handpicked recommendations based on this title.</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                 </div>
                 <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-2">
                    <RecommendationList bookId={book._id} />
                 </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}