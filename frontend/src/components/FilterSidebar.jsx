// src/components/FilterSidebar.jsx
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
  const [category, setCategory] = useState(''); // New State

  function apply() {
    // Pass the current state up to the parent including category
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit sticky top-24">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-serif font-bold text-slate-900 text-lg">Filters</h3>
        <button onClick={reset} className="text-xs text-indigo-600 font-medium hover:underline">Reset All</button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
        <select 
          value={category} 
          onChange={e => setCategory(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Price Range (₹)</label>
        <div className="flex gap-2 items-center">
          <input 
            type="number" 
            placeholder="Min" 
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Minimum Rating</label>
        <div className="space-y-2">
          {[4, 3, 2, 1].map(r => (
            <label key={r} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
              <div className="relative flex items-center">
                <input 
                    type="radio" 
                    name="rating" 
                    value={r} 
                    checked={Number(minRating) === r}
                    onChange={e => setMinRating(e.target.value)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all"
                />
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
              </div>
              <span className="text-slate-700 flex items-center gap-1">
                {r}+ Stars <span className="text-yellow-400 text-xs">★</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <button onClick={apply} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all">
        Apply Filters
      </button>
    </div>
  );
}