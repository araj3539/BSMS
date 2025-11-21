import React, { useEffect, useState } from 'react';
import api from '../services/api';
import BookCard from './BookCard';

export default function RecommendationList({ bookId }) {
  const [recs, setRecs] = useState([]);

  useEffect(()=>{
    let mounted = true;
    const url = bookId ? `/admin/recommendations/${bookId}` : '/admin/recommendations';
    api.get(url)
      .then(r => {
        if (!mounted) return;
        const data = Array.isArray(r.data) ? r.data : (r.data.best || []);
        setRecs(prev => {
          const prevIds = prev.map(x => x._id).join(',');
          const newIds = data.map(x => x._id).join(',');
          return prevIds === newIds ? prev : data;
        });
      })
      .catch(()=>{ /* ignore */ });
    return () => { mounted = false; };
  }, [bookId]);

  if(!recs || recs.length === 0) return null;

  return (
    <div className="border-l border-slate-200 pl-0 lg:pl-12 mt-12 lg:mt-0">
      <div className="mb-8">
        <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">You Might Also Like</h3>
        <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
      </div>
      
      {/* Changed grid columns to be less congested on medium screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {recs.slice(0, 4).map(b => (
           <BookCard key={b._id} book={b} />
        ))}
      </div>
    </div>
  );
}