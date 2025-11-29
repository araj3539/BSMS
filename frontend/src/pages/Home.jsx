import React, { useEffect, useState } from "react";
import api from "../services/api";
import BookCard from "../components/BookCard";
import FilterSidebar from "../components/FilterSidebar";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonBookCard from "../components/SkeletonBookCard";
import { useDebounce } from '../hooks/useDebounce';

// --- Trust Features Component ---
function TrustBar() {
  const features = [
    { icon: "🚚", title: "Free Shipping", desc: "On orders over ₹500" },
    { icon: "🛡️", title: "Secure Payment", desc: "100% protected transactions" },
    { icon: "⚡", title: "Fast Delivery", desc: "Dispatch within 24 hours" },
    { icon: "↩️", title: "Easy Returns", desc: "7-day return policy" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-b border-slate-100">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-300">
          <span className="text-2xl bg-indigo-50 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">{f.icon}</span>
          <div>
            <h4 className="font-bold text-slate-800 text-sm leading-tight">{f.title}</h4>
            <p className="text-[11px] text-slate-500 font-medium">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-slate-900 py-24 lg:py-32 overflow-hidden isolation-auto">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-fuchsia-600/10 blur-[100px]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold uppercase tracking-widest shadow-xl mb-6 hover:bg-white/10 transition-colors cursor-default">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                The #1 Online Bookstore
              </div>
              
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight drop-shadow-sm">
                Stories That <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Ignite Your Mind.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto mt-6">
                From timeless classics to trending bestsellers, find the books that shape your world. Delivered fast, packaged with care.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={onSearch}
              className="relative max-w-xl mx-auto group z-20"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-2 shadow-2xl ring-1 ring-white/10 focus-within:ring-indigo-400/50 transition-all">
                <div className="pl-4 text-indigo-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by title, author, or ISBN..."
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-400 font-medium focus:outline-none w-full"
                />
                <button className="bg-white text-slate-900 hover:bg-indigo-50 px-8 py-3 rounded-full font-bold text-sm transition-all transform hover:scale-[1.02] shadow-lg active:scale-95">
                  Search
                </button>
              </div>
            </motion.form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 md:p-6 max-w-5xl mx-auto">
           <TrustBar />
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="container mx-auto px-6 py-16 flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-28 space-y-8">
            <FilterSidebar onFilter={handleFilter} />
            
            {/* Promo Banner in Sidebar */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <h4 className="font-serif font-bold text-xl mb-2 relative z-10">Summer Sale</h4>
               <p className="text-indigo-100 text-sm mb-4 relative z-10">Get <span className="font-bold text-white">20% OFF</span> on all fiction books.</p>
               <div className="inline-block bg-white/20 border border-white/20 rounded-lg px-3 py-1 font-mono text-sm font-bold tracking-wider relative z-10">SUMMER20</div>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <main className="flex-1">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900">
                {q ? `Search: "${q}"` : filters.category ? `${filters.category}` : "All Books"}
              </h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Showing <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{books.length}</span> of {total} curated results
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="group relative">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="appearance-none bg-white border border-slate-200 text-sm font-bold text-slate-700 pl-4 pr-10 py-2.5 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="top_rated">Top Rated</option>
                  <option value="bestsellers">Best Sellers</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
              
              <div className="group relative">
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="appearance-none bg-white border border-slate-200 text-sm font-bold text-slate-700 pl-4 pr-8 py-2.5 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={8}>Show 8</option>
                  <option value={12}>Show 12</option>
                  <option value={24}>Show 24</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {[...Array(limit)].map((_, i) => <SkeletonBookCard key={i} />)}
            </div>
          ) : (
            <>
              {books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-center px-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner">📚</div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">No books found</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-8">We couldn't find any books matching your search. Try adjusting your filters or search terms.</p>
                  <button
                    onClick={() => {
                      setQ("");
                      setFilters({ minPrice: "", maxPrice: "", minRating: "", category: "" });
                    }}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-8 gap-y-12">
                  <AnimatePresence mode="popLayout">
                    {books.map((b, i) => (
                      <motion.div
                        key={b._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: i * 0.05, ease: "backOut" }}
                      >
                        <BookCard book={b} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-20 flex justify-center items-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  
                  <span className="text-sm font-bold text-slate-700 bg-white px-6 py-2 rounded-full border border-slate-200 shadow-sm tracking-wide">
                    Page <span className="text-indigo-600">{page}</span> of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
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