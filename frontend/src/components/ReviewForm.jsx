import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function ReviewForm({ bookId, onReviewAdded }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a star rating');
    if (!comment.trim()) return toast.error('Please write a comment');
    
    setSubmitting(true);
    try {
      await api.post(`/books/${bookId}/reviews`, { rating, comment });
      toast.success('Review submitted successfully!');
      setComment('');
      setRating(0);
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm mt-8">
      <h4 className="font-serif text-xl font-bold text-slate-900 mb-1">Write a Review</h4>
      <p className="text-slate-500 text-sm mb-6">Share your thoughts with other readers.</p>
      
      <form onSubmit={submit}>
        {/* Interactive Star Rating */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Your Rating</label>
          <div className="flex gap-2" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill={(hoverRating || rating) >= star ? "#EAB308" : "none"} // Yellow-500 when active
                  stroke={(hoverRating || rating) >= star ? "#EAB308" : "#CBD5E1"} // Slate-300 when empty
                  strokeWidth="1.5"
                  className="transition-colors duration-200"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.545.044.77.77.357 1.143l-4.224 3.778a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.224-3.778c-.413-.373-.188-1.1.357-1.143l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            ))}
          </div>
          <p className="text-sm text-indigo-600 mt-1 font-medium h-5">
            {hoverRating === 1 ? "Poor" : hoverRating === 2 ? "Fair" : hoverRating === 3 ? "Good" : hoverRating === 4 ? "Very Good" : hoverRating === 5 ? "Excellent!" : rating > 0 ? "Thanks for rating!" : ""}
          </p>
        </div>

        {/* Modern Comment Box */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Your Review</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
            rows="4"
            placeholder="What did you like or dislike? What was the plot like?"
          />
        </div>

        <button 
          disabled={submitting}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
             <>
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               <span>Posting...</span>
             </>
          ) : (
             'Submit Review'
          )}
        </button>
      </form>
    </div>
  );
}