import React, { useEffect, useState } from "react";
import api from "../services/api";
import BookCard from "../components/BookCard";
import FilterSidebar from "../components/FilterSidebar";
import { useSearchParams } from "react-router-dom";

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minRating: searchParams.get("minRating") || "",
    category: searchParams.get("category") || "", // 1. Add Category state
  });

  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [limit, setLimit] = useState(Number(searchParams.get("limit") || 12));

  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBooks();

    const params = { page, limit };
    if (q) params.q = q;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.minRating) params.minRating = filters.minRating;
    if (filters.category) params.category = filters.category;
    if (sortBy !== "newest") params.sort = sortBy; // Sync sort to URL

    setSearchParams(params, { replace: true });
  }, [page, limit, q, filters, sortBy]); // <--- Add sortBy here

  async function fetchBooks() {
    setLoading(true);
    try {
      // 3. PASS SORT TO API
      const params = { page, limit, q, ...filters, sort: sortBy };
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
      {/* Hero Section (Same as before) */}
      <div className="bg-slate-900 py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/30 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-white drop-shadow-md leading-tight">
            Discover Your Next <br className="hidden md:block" /> Great Read
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Explore our curated collection of bestsellers, classics, and hidden
            gems delivered straight to your door.
          </p>
          <form
            onSubmit={onSearch}
            className="max-w-2xl mx-auto flex bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-2 shadow-2xl transition-all focus-within:bg-white focus-within:shadow-white/20"
          >
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1); // <--- ADD THIS LINE
              }}
              placeholder="Search by title, author, or ISBN..."
              className="flex-1 bg-transparent px-6 py-3 text-white placeholder-slate-300 focus:text-slate-900 outline-none transition-colors"
            />
            <button className="bg-white text-slate-900 hover:bg-indigo-50 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <FilterSidebar onFilter={handleFilter} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                {q || filters.category ? `Results` : "All Books"}
              </h2>
              {filters.category && (
                <span className="text-indigo-600 font-medium text-sm block mt-1">
                  Category: {filters.category}
                </span>
              )}
              <p className="text-sm text-slate-500 mt-1">
                Showing {books.length} of {total} results
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="top_rated">Top Rated</option>
                <option value="bestsellers">Best Sellers</option>
              </select>
              <span className="text-sm font-medium text-slate-500">Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="loader"></div>
            </div>
          ) : (
            <>
              {books.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-400 text-lg mb-2">
                    No books found matching your criteria.
                  </p>
                  <button
                    onClick={() => {
                      setQ("");
                      setFilters({
                        minPrice: "",
                        maxPrice: "",
                        minRating: "",
                        category: "",
                      });
                    }}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10"
                >
                  <AnimatePresence>
                    {books.map((b, i) => (
                      <motion.div
                        key={b._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }} // <--- THE STAGGER MAGIC
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
                    className="px-5 py-2.5 border border-slate-200 rounded-full text-slate-600 font-medium hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    &larr; Previous
                  </button>
                  <span className="text-sm text-slate-500 font-medium tracking-wide">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-5 py-2.5 border border-slate-200 rounded-full text-slate-600 font-medium hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
