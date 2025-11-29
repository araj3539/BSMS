// src/Pages/AdminBooks.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import BookForm from "../components/BookForm";
import { getUser } from "../utils/auth";
import { toast } from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

// --- CLOUDINARY DETAILS ---
const CLOUDINARY_CLOUD_NAME = "dnq0yso32";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_upload_preset";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;


const debouncedQ = useDebounce(q, 500);

export default function AdminBooks() {
  const [q, setQ] = useState("");
  const [books, setBooks] = useState([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  // State now controls the Modal visibility
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const [loading, setLoading] = useState(false);
  const user = getUser();
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (!user || user.role !== "admin") return;

    fetchBooks();

    // Close modal on Escape
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      mounted = false;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [user, page, debouncedQ]); // <--- Add 'page' to dependency array

  function closeModal() {
    setEditing(null);
    setCreating(false);
  }

  async function fetchBooks() {
    try {
      // Pass page and limit to backend
      const res = await api.get(
        `/books?limit=${LIMIT}&page=${page}&q=${debouncedQ}`
      );
      setBooks(res.data.books || []);
      setTotal(res.data.total || 0); // Store total count
    } catch (e) {
      console.error(e);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const toastId = toast.loading("Uploading books...");
    try {
      const res = await api.post("/books/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data.msg, { id: toastId });
      fetchBooks();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Upload failed", { id: toastId });
    }
    e.target.value = "";
  }

  async function uploadFile(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error("Upload failed", err);
      return null;
    }
  }

  async function handleFormSubmit(data, files, isUpdate = false) {
    setLoading(true);
    const dataToSubmit = { ...data };
    try {
      if (files.coverImage)
        dataToSubmit.coverImageUrl = await uploadFile(files.coverImage);
      if (files.ebook) dataToSubmit.ebookUrl = await uploadFile(files.ebook);
      if (files.audiobook)
        dataToSubmit.audiobookUrl = await uploadFile(files.audiobook);

      if (isUpdate) await api.put("/books/" + dataToSubmit._id, dataToSubmit);
      else await api.post("/books", dataToSubmit);

      closeModal();
      fetchBooks();
      toast.success(isUpdate ? "Book updated" : "Book created");
    } catch (err) {
      toast.error(err.response?.data?.msg || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function createBook(data, files) {
    handleFormSubmit(data, files, false);
  }
  function updateBook(data, files) {
    handleFormSubmit(data, files, true);
  }

  async function deleteBook(id) {
    if (!confirm("Delete this book?")) return;
    await api.delete("/books/" + id);
    fetchBooks();
    toast.success("Book deleted");
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="loader"></div>
          <p className="font-medium text-slate-600">Processing...</p>
        </div>
      </div>
    );
  }

  const isModalOpen = creating || editing;

  return (
    <div className="relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between mb-8 items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Manage Books
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Add, edit, or remove books from your inventory.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search books..."
            className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
          />

          <button
            onClick={() => fileInputRef.current.click()}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="text-lg">📄</span> Import CSV
          </button>

          <button
            onClick={() => {
              closeModal();
              setCreating(true);
            }}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all font-medium text-sm shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Add Book
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((b) => (
          <div
            key={b._id}
            className="group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
          >
            <div className="relative mb-4 overflow-hidden rounded-xl bg-slate-100 aspect-[2/3]">
              <img
                src={b.coverImageUrl || "/Placeholder.jpg"}
                alt={b.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {b.stock <= 0 && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase tracking-wider border border-white/30 px-3 py-1 rounded-full backdrop-blur-md">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate" title={b.title}>
                {b.title}
              </h3>
              <p className="text-sm text-slate-500 truncate mb-3">{b.author}</p>

              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg mb-4">
                <span className="font-bold text-slate-900">₹{b.price}</span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    b.stock > 10
                      ? "bg-emerald-100 text-emerald-700"
                      : b.stock > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  Stock: {b.stock}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
              <button
                onClick={() => {
                  setCreating(false);
                  setEditing(b);
                }}
                className="py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => deleteBook(b._id)}
                className="py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:border-red-500 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. NEW: Add Pagination Controls at the bottom */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12 mb-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* --- MODERN MODAL POPUP --- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop with Blur */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-popIn flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {creating ? "Add New Book" : "Edit Book"}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {creating
                    ? "Fill in the details to create a new entry."
                    : "Update book details and stock."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {creating && (
                <BookForm onSubmit={createBook} submitLabel="Create Book" />
              )}
              {editing && (
                <BookForm
                  initial={editing}
                  onSubmit={updateBook}
                  submitLabel="Save Changes"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation Keyframes (Inline for simplicity) */}
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-popIn {
          animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
