import React, { useEffect, useState } from "react";
import api from "../services/api";
import BookCard from "../components/BookCard";
import FilterSidebar from "../components/FilterSidebar";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonBookCard from "../components/SkeletonBookCard";
import { useDebounce } from '../hooks/useDebounce';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minRating: searchParams.get("minRating") || "",
    category: searchParams.get("category") || "",
  });

  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [limit, setLimit] = useState(Number(searchParams.get("limit") || 12));

  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBooks();
    const params = { page, limit };
    if (debouncedQ) params.q = debouncedQ;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.minRating) params.minRating = filters.minRating;
    if (filters.category) params.category = filters.category;
    if (sortBy !== "newest") params.sort = sortBy;

    setSearchParams(params, { replace: true });
    fetchBooks();
  }, [page, limit, debouncedQ, filters, sortBy]);

  async function fetchBooks() {
    setLoading(true);
    try {
      const params = { page, limit, q: debouncedQ, ...filters, sort: sortBy };
      const res = await api.get("/books", { params });
      setBooks(res.data.books || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilter(newFilters) {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }

  function onSearch(e) {
    e.preventDefault();
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- HERO SECTION --- */}
      <div className="relative bg-slate-900 py-24 lg:py-32 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-purple-600/20 blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }}
            >
              <span className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-200 text-sm font-semibold border border-indigo-500/30 uppercase tracking-widest">
                Explore. Dream. Discover.
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mt-6 mb-6 leading-tight">
                Your Next Favorite Story <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Starts Here.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto">
                Dive into our curated collection of bestsellers, timeless classics, and hidden gems. 
                Delivered with care to your doorstep.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={onSearch}
              className="relative max-w-xl mx-auto group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-2 shadow-2xl">
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by title, author, or ISBN..."
                  className="flex-1 bg-transparent px-6 py-3 text-white placeholder-slate-400 focus:text-white outline-none w-full font-medium"
                />
                <button className="bg-white text-slate-900 hover:bg-indigo-50 px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg">
                  Search
                </button>
              </div>
            </motion.form>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <FilterSidebar onFilter={handleFilter} />
          </div>
        </aside>

        {/* Main Grid */}
        <main className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900">
                {q || filters.category ? `Results` : "All Books"}
              </h2>
              {filters.category && (
                <span className="text-indigo-600 font-medium text-sm block mt-1">
                  Category: {filters.category}
                </span>
              )}
              <p className="text-sm text-slate-500 mt-2">
                Showing <span className="font-bold text-slate-900">{books.length}</span> of {total} results
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="top_rated">Top Rated</option>
                  <option value="bestsellers">Best Sellers</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Show</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(limit)].map((_, i) => <SkeletonBookCard key={i} />)}
            </div>
          ) : (
            <>
              {books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-slate-900">No books found</h3>
                  <p className="text-slate-500 mt-2 mb-6">Try adjusting your search or filters.</p>
                  <button
                    onClick={() => {
                      setQ("");
                      setFilters({ minPrice: "", maxPrice: "", minRating: "", category: "" });
                    }}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {books.map((b, i) => (
                      <motion.div
                        key={b._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      >
                        <BookCard book={b} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 font-bold hover:bg-slate-50 hover:shadow-md transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    &larr; Prev
                  </button>
                  <span className="text-sm font-bold text-slate-500 tracking-wide">
                    Page <span className="text-indigo-600">{page}</span> of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 font-bold hover:bg-slate-50 hover:shadow-md transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}