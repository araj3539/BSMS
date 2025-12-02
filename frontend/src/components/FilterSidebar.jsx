import React, { useState } from 'react';

const CATEGORIES = [
  "Fiction", "Non-Fiction", "Science Fiction", "Mystery", "Thriller", 
  "Romance", "Fantasy", "Biography", "History", "Self-Help", 
  "Business", "Economics", "Children", "Young Adult", "Crime", 
  "Cooking", "Travel", "Art", "Poetry", "Religion", 
  "Science", "Technology", "Philosophy", "Psychology", "Politics", 
  "Graphic Novels", "Manga", "Comics", "Health", "Fitness", 
  "Education", "Reference"
].sort();

export default function FilterSidebar({ onFilter }) {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [category, setCategory] = useState('');

  function apply() {
    onFilter({ minPrice, maxPrice, minRating, category });
  }

  function reset() {
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setCategory('');
    onFilter({ minPrice: '', maxPrice: '', minRating: '', category: '' });
  }

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-serif font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filters
        </h3>
        <button 
          onClick={reset} 
          className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="p-5 space-y-8">
        
        {/* Category */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</label>
          <div className="relative">
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price Range (₹)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min" 
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-center font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600"
            />
            <span className="text-slate-300 dark:text-slate-600 font-light">—</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-center font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600"
            />
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rating</label>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(r => (
              <label key={r} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  <span className="flex text-yellow-400 text-xs">
                    {[...Array(r)].map((_, i) => <span key={i}>★</span>)}
                    {[...Array(5-r)].map((_, i) => <span key={i} className="text-slate-200 dark:text-slate-700">★</span>)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs">& Up</span>
                </span>
                <input 
                    type="radio" 
                    name="rating" 
                    value={r} 
                    checked={Number(minRating) === r}
                    onChange={e => setMinRating(e.target.value)}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 cursor-pointer accent-indigo-600"
                />
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={apply} 
          className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 dark:shadow-indigo-900/20 hover:shadow-indigo-200 dark:hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}