import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function RecommendationList({ bookId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/books/${bookId}/recommendations`);
        setRecommendations(data);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [bookId]);

  if (loading) {
    return (
      <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-serif font-bold text-slate-900 mb-4">Because you liked this...</h3>
        <div className="flex flex-col gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-16 h-24 bg-slate-200 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-xl font-serif font-bold text-slate-900 mb-4">Because you liked this...</h3>
      <div className="flex flex-col gap-4">
        {recommendations.map((book, index) => (
          <motion.div
            key={book._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex gap-4 group"
          >
            <Link to={`/book/${book._id}`} className="shrink-0">
              <img 
                src={book.coverImageUrl || "/Placeholder.jpg"} 
                alt={book.title} 
                className="w-16 h-24 object-cover rounded-lg shadow-sm border border-slate-100 group-hover:scale-105 transition-transform"
              />
            </Link>
            <div className="flex flex-col justify-center">
              <Link to={`/book/${book._id}`}>
                <h4 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {book.title}
                </h4>
              </Link>
              <p className="text-xs text-slate-500 mt-1">{book.author}</p>
              <p className="text-sm font-bold text-slate-900 mt-2">₹{book.price}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}