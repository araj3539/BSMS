import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';

export default function MyLibrary() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/books/my-library')
      .then(res => setBooks(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-24 font-sans">
      
      {/* Header */}
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">My Library</h1>
          <p className="text-slate-500 mt-2 font-medium">
            You own <span className="text-indigo-600 font-bold">{books.length}</span> titles
          </p>
        </div>
      </div>

      {/* Library Grid */}
      {books.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-6xl mb-4 opacity-40">📚</div>
          <h3 className="text-xl font-bold text-slate-800">Your library is empty</h3>
          <p className="text-slate-500 mt-2 mb-6">Discover your next great adventure in our store.</p>
          <Link to="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
            Explore Books
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {books.map((book, index) => {
            const hasDigital = book.ebookUrl || book.audiobookUrl;
            
            return (
              <motion.div 
                key={book._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-5"
              >
                {/* Book Cover */}
                <div className="w-24 md:w-32 flex-shrink-0">
                  <Link to={`/book/${book._id}`}>
                    <img 
                      src={book.coverImageUrl || '/Placeholder.jpg'} 
                      alt={book.title}
                      className="w-full h-auto aspect-[2/3] object-cover rounded-xl shadow-md border border-slate-100"
                    />
                  </Link>
                </div>

                {/* Book Details & Actions */}
                <div className="flex flex-col flex-1 min-w-0 py-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    {book.category?.replace(/[[\]']/g, '').split(',')[0]}
                  </span>
                  
                  <Link to={`/book/${book._id}`}>
                    <h3 className="font-serif text-lg md:text-xl font-bold text-slate-900 leading-tight mb-1 truncate">
                      {book.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-500 font-medium mb-4 truncate">by {book.author}</p>

                  <div className="mt-auto flex flex-wrap gap-2.5">
                    {book.ebookUrl && (
                      <Link 
                        to={`/read/${book._id}`}
                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-100"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        Read
                      </Link>
                    )}
                    
                    {book.audiobookUrl && (
                      <Link 
                        to={`/listen/${book._id}`}
                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-fuchsia-50 text-fuchsia-700 rounded-xl font-bold text-sm hover:bg-fuchsia-600 hover:text-white transition-colors border border-fuchsia-100"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                        Listen
                      </Link>
                    )}

                    {!hasDigital && (
                      <div className="w-full flex items-center justify-center py-2.5 bg-slate-50 text-slate-400 rounded-xl text-sm font-medium border border-slate-100">
                        Physical Copy Only
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}