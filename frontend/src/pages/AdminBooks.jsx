// src/pages/AdminBooks.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import BookForm from "../components/BookForm";
import { toast } from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";

const CLOUDINARY_CLOUD_NAME = "dnq0yso32";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_upload_preset";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

export default function AdminBooks() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 500);

  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBooks();
  }, [page, debouncedQ]);

  function closeModal() {
    setEditing(null);
    setCreating(false);
  }

  async function fetchBooks() {
    try {
      const res = await api.get(`/books?limit=${LIMIT}&page=${page}&q=${debouncedQ}`);
      setBooks(res.data.books || []);
      setTotal(res.data.total || 0);
    } catch (e) { console.error(e); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  async function uploadFile(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      const data = await res.json();
      return data.secure_url;
    } catch (err) { return null; }
  }

  async function handleFormSubmit(data, files, isUpdate = false) {
    setLoading(true);
    const dataToSubmit = { ...data };
    try {
      if (files.coverImage) dataToSubmit.coverImageUrl = await uploadFile(files.coverImage);
      if (files.ebook) dataToSubmit.ebookUrl = await uploadFile(files.ebook);
      if (files.audiobook) dataToSubmit.audiobookUrl = await uploadFile(files.audiobook);

      if (isUpdate) await api.put("/books/" + dataToSubmit._id, dataToSubmit);
      else await api.post("/books", dataToSubmit);

      closeModal();
      fetchBooks();
      toast.success(isUpdate ? "Book updated" : "Book created");
    } catch (err) {
      toast.error(err.response?.data?.msg || "An error occurred.");
    } finally { setLoading(false); }
  }

  async function deleteBook(id) {
    if (!confirm("Delete this book?")) return;
    await api.delete("/books/" + id);
    fetchBooks();
    toast.success("Book deleted");
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const toastId = toast.loading("Uploading books...");
    try {
      await api.post("/books/bulk", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Import successful!", { id: toastId });
      fetchBooks();
    } catch (err) { toast.error("Upload failed", { id: toastId }); }
    e.target.value = "";
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* --- Header & Actions --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-white/50 backdrop-blur-xl p-4 md:p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Inventory</h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">Manage your library catalog</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
           <div className="relative flex-1 sm:w-64 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input 
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder="Search books..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
              />
           </div>
           
           <div className="flex gap-2">
             <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
             <button onClick={() => fileInputRef.current.click()} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
               Import CSV
             </button>
             <button onClick={() => setCreating(true)} className="flex-1 sm:flex-none bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
               + Add
             </button>
           </div>
        </div>
      </div>

      {/* --- Book Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {books.map(b => (
            <motion.div 
              key={b._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-slate-100">
                 <img src={b.coverImageUrl || "/Placeholder.jpg"} alt={b.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                 
                 {/* Stock Badge */}
                 <div className="absolute top-3 left-3">
                    {b.stock === 0 ? (
                        <span className="bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wide">Out of Stock</span>
                    ) : b.stock < 5 ? (
                        <span className="bg-amber-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wide">Low Stock: {b.stock}</span>
                    ) : null}
                 </div>

                 {/* Hover Actions (Always visible on mobile touch sometimes, so good to have distinct buttons) */}
                 <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => setEditing(b)} className="bg-white text-slate-800 p-2.5 rounded-full hover:scale-110 transition-transform shadow-lg" title="Edit">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => deleteBook(b._id)} className="bg-red-500 text-white p-2.5 rounded-full hover:scale-110 transition-transform shadow-lg" title="Delete">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                 </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                 <h3 className="font-bold text-slate-900 line-clamp-1 text-sm md:text-base" title={b.title}>{b.title}</h3>
                 <p className="text-xs text-slate-500 mb-3">{b.author}</p>
                 <div className="mt-auto flex justify-between items-center border-t border-slate-50 pt-3">
                    <span className="font-bold text-slate-900 text-sm">₹{b.price}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">Stock: {b.stock}</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
           <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 bg-white border rounded-lg text-sm disabled:opacity-50">Prev</button>
           <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-4 py-2 bg-white border rounded-lg text-sm disabled:opacity-50">Next</button>
        </div>
      )}

      {/* --- Modal --- */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
           <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300 mx-4">
              <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-serif font-bold text-lg md:text-xl">{creating ? 'Add New Book' : 'Edit Book'}</h3>
                 <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
              </div>
              <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar">
                 <BookForm initial={editing || {}} onSubmit={creating ? (d,f) => handleFormSubmit(d,f,false) : (d,f) => handleFormSubmit(d,f,true)} submitLabel={creating ? 'Create' : 'Save Changes'} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}