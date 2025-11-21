// src/pages/Wishlist.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import BookCard from '../components/BookCard';

export default function Wishlist() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/wishlist')
      .then(res => {
        setBooks(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">My Wishlist</h2>
      {books.length === 0 ? (
        <div className="text-gray-500">Your wishlist is empty.</div>
      ) : (
        <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-4">
          {books.map(b => <BookCard key={b._id} book={b} />)}
        </div>
      )}
    </div>
  );
}