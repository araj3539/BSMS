import React, { useState } from "react";
import CustomSelect from "./CustomSelect";

const CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Fantasy",
  "Biography",
  "History",
  "Self-Help",
  "Business",
  "Economics",
  "Children",
  "Young Adult",
  "Crime",
  "Cooking",
  "Travel",
  "Art",
  "Poetry",
  "Religion",
  "Science",
  "Technology",
  "Philosophy",
  "Psychology",
  "Politics",
  "Graphic Novels",
  "Manga",
  "Comics",
  "Health",
  "Fitness",
  "Education",
  "Reference",
].sort();

export default function FilterSidebar({ onFilter }) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [category, setCategory] = useState("");

  function apply() {
    onFilter({ minPrice, maxPrice, minRating, category });
  }

  function reset() {
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setCategory("");
    onFilter({ minPrice: "", maxPrice: "", minRating: "", category: "" });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-serif font-bold text-slate-900 text-lg flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-600"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filters
        </h3>
        <button
          onClick={reset}
          className="text-[11px] font-bold text-slate-400 uppercase tracking-wide hover:text-red-500 transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="p-5 space-y-8">
        
        {/* Category: Uses CustomSelect */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
          <CustomSelect 
            value={category}
            onChange={(val) => setCategory(val)}
            placeholder="All Categories"
            options={[
                { value: "", label: "All Categories" },
                ...CATEGORIES.map(c => ({ value: c, label: c }))
            ]}
          />
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range (₹)</label>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            <span className="text-slate-300 font-light">—</span>
            <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating</label>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(r => (
              <label key={r} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 group-hover:text-indigo-700">
                  <span className="flex text-yellow-400 text-xs">
                    {[...Array(r)].map((_, i) => <span key={i}>★</span>)}
                    {[...Array(5-r)].map((_, i) => <span key={i} className="text-slate-200">★</span>)}
                  </span>
                  <span className="text-slate-400 text-xs">& Up</span>
                </span>
                <input type="radio" name="rating" value={r} checked={Number(minRating) === r} onChange={e => setMinRating(e.target.value)} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 cursor-pointer" />
              </label>
            ))}
          </div>
        </div>

        <button onClick={apply} className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:shadow-indigo-200 transform hover:-translate-y-0.5 transition-all duration-300">
          Apply Filters
        </button>
      </div>
    </div>
  );
}
