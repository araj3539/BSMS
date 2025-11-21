// src/Pages/AdminBooks.jsx
import React, { useEffect, useState, useRef } from 'react'; // Import useRef
import api from '../services/api';
import BookForm from '../components/BookForm';
import { getUser } from '../utils/auth';
import { toast } from 'react-hot-toast'; // Use toast for better feedback

// --- CLOUDINARY DETAILS (Ideally move to .env in future) ---
const CLOUDINARY_CLOUD_NAME = 'dnq0yso32'; 
const CLOUDINARY_UPLOAD_PRESET = 'unsigned_upload_preset'; 
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

export default function AdminBooks(){
  const [books, setBooks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = getUser();
  
  // Ref for hidden file input
  const fileInputRef = useRef(null);

  useEffect(()=>{
    let mounted = true;
    if(!user || user.role !== 'admin') return;
    fetchBooks();
    return () => { mounted = false; };
  }, [user]);

  async function fetchBooks(){
    try {
      const res = await api.get('/books?limit=100'); // Get more books for admin view
      setBooks(res.data.books || []);
    } catch(e) { console.error(e); }
  }

  // --- BULK UPLOAD HANDLER ---
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Uploading books...');
    try {
      const res = await api.post('/books/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.msg, { id: toastId });
      fetchBooks(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || 'Upload failed', { id: toastId });
    }
    // Reset input so same file can be selected again if needed
    e.target.value = ''; 
  }
  // ---------------------------

  async function uploadFile(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const data = await res.json();
      return data.secure_url; 
    } catch (err) {
      console.error('Upload failed', err);
      return null;
    }
  }

  async function handleFormSubmit(data, files, isUpdate = false) {
    setLoading(true);
    const dataToSubmit = { ...data };
    try {
      if (files.coverImage) dataToSubmit.coverImageUrl = await uploadFile(files.coverImage);
      if (files.ebook) dataToSubmit.ebookUrl = await uploadFile(files.ebook);
      if (files.audiobook) dataToSubmit.audiobookUrl = await uploadFile(files.audiobook);

      if (isUpdate) await api.put('/books/' + dataToSubmit._id, dataToSubmit);
      else await api.post('/books', dataToSubmit);

      setCreating(false);
      setEditing(null);
      fetchBooks();
      toast.success(isUpdate ? 'Book updated' : 'Book created');

    } catch (err) {
      toast.error(err.response?.data?.msg || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function createBook(data, files) { handleFormSubmit(data, files, false); }
  function updateBook(data, files) { handleFormSubmit(data, files, true); }

  async function deleteBook(id){
    if(!confirm('Delete this book?')) return;
    await api.delete('/books/' + id);
    fetchBooks();
    toast.success('Book deleted');
  }

  if (loading) {
    return <div className="text-center p-10"><h2 className="text-xl font-semibold">Processing...</h2></div>;
  }

  return (
    <div>
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-xl font-semibold">Manage Books</h2>
        <div className="flex gap-2">
          {/* Hidden Input */}
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          
          {/* Bulk Upload Button */}
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>📄</span> Import CSV
          </button>

          <button 
            onClick={()=> setCreating(true)} 
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            + Add Book
          </button>
        </div>
      </div>

      {creating && <BookForm onSubmit={createBook} submitLabel="Create" />}

      {editing && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Edit book</h3>
          <BookForm initial={editing} onSubmit={updateBook} submitLabel="Update" />
          <button onClick={()=> setEditing(null)} className="mt-2 text-sm text-gray-600">Cancel</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        {books.map(b => (
          <div key={b._id} className="bg-white p-3 rounded shadow flex flex-col">
            <div className="flex-1">
              <img src={b.coverImageUrl || '/Placeholder.jpg'} alt="" className="w-full h-32 object-cover mb-2 rounded" />
              <div className="font-semibold truncate" title={b.title}>{b.title}</div>
              <div className="text-sm text-gray-600 truncate">{b.author}</div>
              <div className="mt-2 flex justify-between items-center text-sm">
                 <span className="font-bold">₹{b.price}</span>
                 <span className={b.stock > 0 ? "text-green-600" : "text-red-600"}>Stock: {b.stock}</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=> setEditing(b)} className="px-2 py-1 bg-yellow-400 rounded text-sm flex-1 hover:bg-yellow-500">Edit</button>
              <button onClick={()=> deleteBook(b._id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm flex-1 hover:bg-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}