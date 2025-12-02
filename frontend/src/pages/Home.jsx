import React, { useEffect, useState } from "react";
import api from "../services/api";
import BookCard from "../components/BookCard";
import FilterSidebar from "../components/FilterSidebar";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import SkeletonBookCard from "../components/SkeletonBookCard";
import { useDebounce } from '../hooks/useDebounce';

// --- COMPONENTS ---

function TrustBadge({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 shadow-sm backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-2xl text-indigo-600 dark:text-indigo-300 shadow-inner dark:shadow-none group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{desc}</p>
      </div>
    </div>
  );
}

function CategoryPill({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${
        active 
        ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-500 shadow-indigo-500/20' 
        : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
      }`}
    >
      {label}
    </button>
  );
}

function Newsletter() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-800 p-8 md:p-16 text-center text-white shadow-2xl isolate border border-slate-800 dark:border-slate-700">
      {/* Abstract Shapes */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">Unlock Secret Chapters</h2>
        <p className="text-indigo-200 dark:text-slate-300 text-lg">Join 10,000+ readers. Get monthly book recommendations and exclusive flash sale access.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input placeholder="Enter your email" className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-sm transition-all focus:bg-white/20" />
          <button className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">Subscribe</button>
        </div>
        <p className="text-xs text-indigo-400/60 dark:text-slate-500">No spam, just good stories. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]); // Parallax effect

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

  // Common categories for quick filters
  const QUICK_CATEGORIES = ["Fiction", "Sci-Fi", "Romance", "Mystery", "Business", "Self-Help"];

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
    // Scroll to top of grid when page changes (not initial load)
    if(page > 1) document.getElementById('book-grid')?.scrollIntoView({ behavior: 'smooth' });
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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-blob"></div>
           <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-rose-200/40 to-orange-200/40 dark:from-rose-900/20 dark:to-orange-900/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-2000"></div>
           <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-gradient-to-t from-emerald-200/40 to-teal-200/40 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-4000"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-20 mix-blend-overlay dark:opacity-5"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left: Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 text-center lg:text-left space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/10 backdrop-blur-sm text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                New Arrivals In Stock
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-serif font-bold text-slate-900 dark:text-white leading-[1.1] drop-shadow-sm">
                Find Stories That <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Resonate.</span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                A curated sanctuary for book lovers. Discover bestsellers, rare finds, and timeless classics delivered with care.
              </p>

              {/* Search Bar (Hero) */}
              <div className="relative max-w-lg mx-auto lg:mx-0 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 dark:opacity-40 dark:group-hover:opacity-60 transition duration-500"></div>
                <form 
                  onSubmit={(e) => { e.preventDefault(); document.getElementById('book-grid').scrollIntoView({behavior:'smooth'}); }}
                  className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl p-2 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800"
                >
                  <div className="pl-4 text-slate-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                  <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    placeholder="Search by Title, Author, or ISBN..."
                    className="flex-1 bg-transparent px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-full font-medium"
                  />
                  <button className="bg-slate-900 dark:bg-indigo-600 text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-md">
                    Explore
                  </button>
                </form>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-4 opacity-90">
                 <TrustBadge icon="🚚" title="Free Shipping" desc="On orders over ₹500" />
                 <TrustBadge icon="🛡️" title="Secure Payment" desc="100% Protected" />
              </div>
            </motion.div>

            {/* Right: 3D Floating Elements */}
            <motion.div 
              style={{ y: y1 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex-1 relative hidden lg:block"
            >
               <div className="relative w-[500px] h-[600px] mx-auto perspective-1000">
                  {/* Floating Cards / Books Effect */}
                  <motion.div 
                    animate={{ y: [0, -20, 0], rotate: [0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="absolute top-10 left-10 w-64 h-80 bg-slate-800 dark:bg-slate-900 rounded-r-2xl rounded-l-md shadow-2xl border-l-8 border-slate-700 dark:border-slate-800 z-20 flex items-center justify-center overflow-hidden transform rotate-[-6deg]"
                  >
                     {/* Fake Book Cover Art */}
                     <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black"></div>
                     <div className="relative text-center p-6 border-2 border-white/10 m-4 h-[90%] rounded-lg flex flex-col justify-center">
                        <div className="text-xs text-indigo-400 font-bold tracking-[0.2em] mb-2 uppercase">Bestseller</div>
                        <h3 className="text-3xl font-serif text-white font-bold mb-2">The Art of <br/>Code</h3>
                        <p className="text-slate-400 text-xs italic">Mastering the craft</p>
                     </div>
                  </motion.div>

                  <motion.div 
                    animate={{ y: [0, 30, 0], rotate: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
                    className="absolute top-24 right-10 w-60 h-72 bg-white dark:bg-slate-800 rounded-r-2xl rounded-l-md shadow-xl border-l-4 border-slate-200 dark:border-slate-700 z-10 flex items-center justify-center overflow-hidden transform rotate-[12deg]"
                  >
                     <div className="text-center p-4">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">🌿</div>
                        <h3 className="text-xl font-serif text-slate-800 dark:text-white font-bold">Modern <br/>Living</h3>
                     </div>
                  </motion.div>

                  {/* Decorative Elements */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-20"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-slate-900/5 dark:border-white/5 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-slate-900/5 dark:border-white/5 rounded-full"></div>
               </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div id="book-grid" className="container mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 order-2 lg:order-1">
          <div className="sticky top-28 space-y-8">
            <FilterSidebar onFilter={handleFilter} />
            
            {/* Promo Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-violet-900 rounded-2xl p-6 text-white shadow-lg text-center group cursor-pointer border border-white/10">
               <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Weekly Deal</p>
               <h3 className="text-2xl font-serif font-bold mb-2 text-white">Summer Reading</h3>
               <p className="text-sm text-indigo-100 mb-4">Get up to 30% off on all fiction bestsellers.</p>
               <div className="inline-block bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg font-mono text-sm font-bold tracking-wider">
                  SUMMER30
               </div>
            </div>
          </div>
        </aside>

        {/* Main Grid Area */}
        <main className="flex-1 order-1 lg:order-2">
          
          {/* Quick Categories Bar */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
             <CategoryPill label="All Books" active={!filters.category} onClick={() => handleFilter({ category: '' })} />
             {QUICK_CATEGORIES.map(cat => (
                <CategoryPill 
                  key={cat} 
                  label={cat} 
                  active={filters.category === cat} 
                  onClick={() => handleFilter({ category: cat })} 
                />
             ))}
          </div>

          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
             <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
                   {q ? `Results for "${q}"` : filters.category ? `${filters.category} Books` : "Popular Books"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Showing <span className="text-slate-900 dark:text-white font-bold">{books.length}</span> of {total} results</p>
             </div>
             
             {/* Sort Dropdown */}
             <div className="relative group">
                <select 
                   value={sortBy} 
                   onChange={e => { setSortBy(e.target.value); setPage(1); }} 
                   className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-4 pr-10 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none hover:border-indigo-300 transition-all shadow-sm"
                >
                   <option value="newest">Newest Arrivals</option>
                   <option value="price_asc">Price: Low to High</option>
                   <option value="price_desc">Price: High to Low</option>
                   <option value="top_rated">Top Rated</option>
                   <option value="bestsellers">Best Sellers</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
             </div>
          </div>

          {/* Books Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonBookCard key={i} />)}
            </div>
          ) : (
            <>
              {books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                   <div className="text-6xl mb-4 opacity-30 dark:opacity-50 grayscale">📚</div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">No books found</h3>
                   <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6 text-center max-w-xs">We couldn't find matches for your search. Try checking your spelling or clear filters.</p>
                   <button onClick={() => { setQ(""); setFilters({ minPrice: "", maxPrice: "", minRating: "", category: "" }); }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Clear all filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
                  <AnimatePresence mode="popLayout">
                    {books.map((b, i) => (
                      <motion.div
                        key={b._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                      >
                        <BookCard book={b} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all font-bold text-slate-600 dark:text-slate-300">←</button>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all font-bold text-slate-600 dark:text-slate-300">→</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* --- PRE-FOOTER SECTION --- */}
      <div className="container mx-auto px-6 pb-20">
         <Newsletter />
      </div>
    </div>
  );
}