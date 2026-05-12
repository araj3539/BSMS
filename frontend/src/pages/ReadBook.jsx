import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactReader } from 'react-reader';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ReadBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [bookTitle, setBookTitle] = useState("");
  const [bookBuffer, setBookBuffer] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAndFetchAccess = async () => {
      try {
        // 1. Verify access and get the title
        const { data } = await api.get(`/books/${id}/read`);
        setBookTitle(data.title);

        // 2. Fetch the actual EPUB file securely through our backend proxy!
        // This bypasses CORS and includes our Auth token.
        const fileResponse = await api.get(`/books/${id}/download-epub`, {
          responseType: 'arraybuffer' // Crucial: Tell axios we want raw file data, not JSON
        });

        // Set the raw file data into state
        setBookBuffer(fileResponse.data);

      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Access denied or file not found.");
        navigate('/my-orders'); 
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchAccess();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">Decrypting and loading book securely...</p>
      </div>
    );
  }

  // Only render the reader once we have the file buffer
  if (!bookBuffer) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
        <h1 className="font-bold text-lg text-slate-800">{bookTitle}</h1>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
        >
          Close Book
        </button>
      </div>

      {/* The Actual Reader */}
      <div className="flex-grow relative">
        <ReactReader
          url={bookBuffer} // Pass the raw file data directly instead of a link!
          location={location}
          locationChanged={(epubcifi) => setLocation(epubcifi)}
          epubInitOptions={{
            openAs: 'epub'
          }}
          epubOptions={{
            flow: 'paginated',
            manager: 'continuous'
          }}
        />
      </div>
    </div>
  );
}