// src/components/BookForm.jsx
import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  "Fiction", "Non-Fiction", "Science Fiction", "Mystery", "Thriller", 
  "Romance", "Fantasy", "Biography", "History", "Self-Help", 
  "Business", "Economics", "Children", "Young Adult", "Crime", 
  "Cooking", "Travel", "Art", "Poetry", "Religion", 
  "Science", "Technology", "Philosophy", "Psychology", "Politics", 
  "Graphic Novels", "Manga", "Comics", "Health", "Fitness", 
  "Education", "Reference"
].sort();

export default function BookForm({ initial = {}, onSubmit, submitLabel = 'Save' }){
  // FIX: Initialize price/stock as empty strings so placeholders show up
  const [form, setForm] = useState({
    title: '', author: '', price: '', stock: '', category: '', isbn:'', description:'', coverImageUrl:'', ebookUrl:'', audiobookUrl:'', 
    ...initial
  });

  const [files, setFiles] = useState({
    coverImage: null,
    ebook: null,
    audiobook: null
  });

  useEffect(() => {
    setForm(prev => {
      const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(initial)]));
      // Only update if initial actually has data (for edit mode)
      if(Object.keys(initial).length > 0) {
         return { ...prev, ...initial };
      }
      return prev;
    });
  }, [JSON.stringify(initial)]); 

  function change(e){
    const { name, value } = e.target;
    // FIX: Allow empty string to clear the input (prevent it getting stuck at 0)
    const val = (name === 'price' || name === 'stock') 
        ? (value === '' ? '' : Number(value)) 
        : value;

    setForm(s => ({ ...s, [name]: val }));
  }

  function changeFile(e) {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(s => ({ ...s, [name]: selectedFiles[0] }));
    }
  }

  function submit(e){
    e.preventDefault();
    if(!form.title || !form.price) return alert('Title and price required');
    onSubmit(form, files);
  }

  return (
    <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Title</label>
            <input name="title" value={form.title} onChange={change} placeholder="Enter book title" className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500" />
        </div>
        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Author</label>
            <input name="author" value={form.author} onChange={change} placeholder="Author name" className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500" />
        </div>
        
        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price (₹)</label>
            <input name="price" value={form.price} onChange={change} placeholder="0.00" type="number" className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500" />
        </div>
        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Stock</label>
            <input name="stock" value={form.stock} onChange={change} placeholder="0" type="number" className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500" />
        </div>

        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
            <select name="category" value={form.category} onChange={change} className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white">
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">ISBN</label>
            <input name="isbn" value={form.isbn} onChange={change} placeholder="ISBN Number" className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={change} placeholder="Book summary..." className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500" rows={3} />
      </div>
      
      {/* File Inputs */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
            <label className="block text-xs font-bold text-slate-700 mb-2">Cover Image</label>
            {form.coverImageUrl && !files.coverImage && <img src={form.coverImageUrl} alt="cover" className="w-16 h-20 object-cover mb-2 rounded border" />}
            <input type="file" name="coverImage" onChange={changeFile} accept="image/*" className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
        </div>

        <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
            <label className="block text-xs font-bold text-slate-700 mb-2">E-book (PDF)</label>
            {form.ebookUrl && !files.ebook && <a href={form.ebookUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs block mb-2 hover:underline">View Current File</a>}
            <input type="file" name="ebook" onChange={changeFile} accept="application/pdf" className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
        </div>

        <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
            <label className="block text-xs font-bold text-slate-700 mb-2">Audiobook (MP3)</label>
            {form.audiobookUrl && !files.audiobook && <audio src={form.audiobookUrl} controls className="w-full h-8 mb-2" />}
            <input type="file" name="audiobook" onChange={changeFile} accept="audio/mpeg" className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all">{submitLabel}</button>
      </div>
    </form>
  );
}