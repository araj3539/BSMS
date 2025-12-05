import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext"; // Use context instead of utils
import RecommendationList from "../components/RecommendationList";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";
import RatingStars from "../components/RatingStars";
import { syncCart } from '../utils/cart';
import SkeletonBookDetail from "../components/SkeletonBookDetail";

export default function BookDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth(); // Get reactive user state
  const [book, setBook] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => { fetchBook(); }, [id]);

  async function fetchBook() {
    try {
      const r = await api.get("/books/" + id);
      setBook(r.data);
    } catch (err) { console.error(err); }
    finally {
      // Add a small artificial delay for smoothness (optional)
      // setTimeout(() => setLoading(false), 300); 
      setLoading(false);
    }
  }

  function addToCart() {
    // Determine the correct storage key
    const cartKey = user ? `cart_${user._id}` : 'cart_guest';
    
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const existing = cart.find((ci) => ci.bookId === book._id);
    
    if (existing) existing.qty += qty;
    else cart.push({ bookId: book._id, title: book.title, price: book.price,coverImageUrl: book.coverImageUrl, qty });
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
    if (user) syncCart(user._id, cart);
    nav("/cart");
  }

  function updateQty(val) {
    if (!book) return;
    setQty(Math.max(1, Math.min(book.stock, Math.floor(val))));
  }

  if (loading || !book) return <SkeletonBookDetail />;
  
  const isOutOfStock = book.stock === 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
        
        {/* LEFT: Image */}
        <div className="w-full md:w-1/3 flex-shrink-0">
          <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 relative">
              <img
                src={book.coverImageUrl || "/Placeholder.jpg"}
                alt={book.title}
                className={`w-full h-auto rounded-xl object-cover aspect-[2/3] ${isOutOfStock ? 'grayscale opacity-90' : ''}`}
              />
              {isOutOfStock && (
                 <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded shadow-lg z-10 uppercase tracking-wide">
                    Out of Stock
                 </div>
              )}
          </div>
        </div>

        {/* RIGHT: Details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">
                {book.category}
             </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight mb-2">
            {book.title}
          </h1>
          <p className="text-xl text-slate-600 font-medium mb-4">by {book.author}</p>

          <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-1">
                <RatingStars rating={book.rating || 0} />
                <span className="text-sm text-slate-500 ml-2 font-medium">{book.rating ? book.rating.toFixed(1) : 0}</span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <span className="text-sm text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors">
              {book.numReviews} Reviews
            </span>
          </div>

          <div className="prose prose-slate text-slate-600 leading-relaxed mb-8 max-w-none">
            <p>{book.description}</p>
          </div>

          {/* Pricing & Action */}
          <div className={`bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-6 justify-between ${isOutOfStock ? 'bg-red-50/50 border-red-100' : ''}`}>
            <div>
                <div className="text-3xl font-bold text-slate-900">₹{book.price}</div>
                <div className={`text-sm mt-1 font-medium ${book.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {book.stock > 0 ? `In Stock (${book.stock} copies)` : "Currently Unavailable"}
                </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Quantity Selector */}
                <div className={`flex items-center border border-slate-300 rounded-lg bg-white h-12 ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button onClick={() => updateQty(qty - 1)} disabled={qty <= 1} className="w-10 h-full text-slate-500 hover:bg-slate-100 rounded-l-lg disabled:opacity-50">-</button>
                    <div className="w-12 text-center font-semibold">{qty}</div>
                    <button onClick={() => updateQty(qty + 1)} disabled={qty >= book.stock} className="w-10 h-full text-slate-500 hover:bg-slate-100 rounded-r-lg disabled:opacity-50">+</button>
                </div>
                
                {/* Add To Cart Button */}
                {isOutOfStock ? (
                    <button disabled className="flex-1 sm:flex-none bg-slate-300 text-slate-500 px-8 py-3 rounded-lg font-semibold h-12 cursor-not-allowed">
                        Out of Stock
                    </button>
                ) : (
                    <button
                        onClick={addToCart}
                        className="flex-1 sm:flex-none bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold h-12 transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                        Add to Cart
                    </button>
                )}
            </div>
          </div>

          {/* Media Links */}
          {(book.ebookUrl || book.audiobookUrl) && (
             <div className="mt-6 flex gap-4">
                {book.ebookUrl && <a href={book.ebookUrl} target="_blank" className="text-sm font-semibold text-indigo-600 flex items-center gap-2 hover:underline"><span className="text-lg">📄</span> Read Sample PDF</a>}
                {book.audiobookUrl && <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><span className="text-lg">🎧</span> <audio controls src={book.audiobookUrl} className="h-8 w-64" /></div>}
             </div>
          )}
        </div>
      </div>

      {/* --- REVIEWS & RECS --- */}
      <div className="mt-20 grid lg:grid-cols-3 gap-12 border-t border-slate-200 pt-12">
        <div className="lg:col-span-2">
            <h3 className="text-2xl font-serif font-bold mb-6">Customer Reviews</h3>
            <ReviewList reviews={book.reviews} user={user} bookId={book._id} onUpdate={fetchBook} />
            {user ? <ReviewForm bookId={book._id} onReviewAdded={fetchBook} /> : <div className="bg-slate-100 p-4 rounded mt-6 text-center">Please <a href="/login" className="font-bold underline">login</a> to review.</div>}
        </div>
        <div>
            <RecommendationList bookId={book._id} />
        </div>
      </div>
    </div>
  );
}