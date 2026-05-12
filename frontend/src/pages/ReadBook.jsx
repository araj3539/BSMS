import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ReadBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAndFetchAccess = async () => {
      try {
        // Just hit the standard read route to get the HTML URL string
        const { data } = await api.get(`/books/${id}/read`);
        setBookData(data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Access denied.");
        navigate('/my-orders'); 
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchAccess();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!bookData || !bookData.ebookUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
        <h1 className="font-bold text-lg text-slate-800">{bookData.title}</h1>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
        >
          Close Book
        </button>
      </div>

      {/* The Embedded HTML Reader */}
      <div className="flex-grow w-full bg-white relative">
        <iframe
          src={bookData.ebookUrl.replace('http://', 'https://')} // Your Gutenberg HTML link goes right here!
          title={bookData.title}
          className="w-full h-full border-0 absolute inset-0"
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      </div>
    </div>
  );
}