import React, { useEffect, useState } from 'react';
import api from '../services/api';
import BookCard from '../components/BookCard';
import SkeletonBookCard from '../components/SkeletonBookCard'; // <--- Import Skeleton
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Wishlist() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/wishlist')
      .then(res => setBooks(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 min-h-screen">
      <div className="mb-10">
        <h2 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">My Wishlist</h2>
        <p className="text-slate-500 mt-2 font-medium">Books you've saved for later.</p>
      </div>

      {loading ? (
        // --- SKELETON LOADING GRID ---
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {[...Array(4)].map((_, i) => (
             <SkeletonBookCard key={i} />
           ))}
        </div>
      ) : books.length === 0 ? (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white/50 border border-dashed border-slate-300 rounded-3xl"
        >
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <span className="text-4xl">❤️</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Your wishlist is empty</h3>
            <p className="text-slate-500 mt-2 mb-8 max-w-sm text-center">Save items you want to see here by clicking the heart icon on any book.</p>
            <Link to="/" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-all hover:-translate-y-1">
                Explore Books
            </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {books.map((b, i) => (
             <motion.div 
                key={b._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
             >
                <BookCard book={b} />
             </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}