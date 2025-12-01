import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { syncCart } from '../utils/cart';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cart(){
  const [cart, setCart] = useState([]);
  const [promo, setPromo] = useState('');
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { user } = useAuth();

  const cartKey = user ? `cart_${user._id}` : 'cart_guest';

  useEffect(() => {
    const localCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    if (localCart.length === 0) { setCart([]); setLoading(false); return; }

    const ids = localCart.map(item => item.bookId);
    api.post('/books/batch', { ids })
      .then(res => {
        const books = res.data;
        let updatedCart = [];
        let changes = false;

        localCart.forEach(cartItem => {
          const book = books.find(b => b._id === cartItem.bookId);
          if (!book) { changes = true; return; }
          
          let newQty = cartItem.qty;
          if (newQty > book.stock && book.stock > 0) {
            newQty = book.stock; 
            changes = true;
          }

          updatedCart.push({
            ...cartItem,
            title: book.title,
            price: book.price,
            stock: book.stock, 
            coverImageUrl: book.coverImageUrl,
            qty: newQty
          });
        });

        setCart(updatedCart);
        localStorage.setItem(cartKey, JSON.stringify(updatedCart));
        if (changes) toast('Cart updated based on availability.', { icon: '⚠️' });
      })
      .catch(err => { console.error(err); setCart(localCart); })
      .finally(() => setLoading(false));
  }, [user, cartKey]);

  function update(i, qty){
    const c = [...cart]; 
    const item = c[i];
    const max = item.stock || 1; 
    const newQty = Math.min(Math.max(1, Number(qty)), max);
    
    item.qty = newQty; 
    setCart(c); 
    localStorage.setItem(cartKey, JSON.stringify(c));
    if (user) syncCart(user._id, c);
  }

  function remove(i){
    const c = cart.filter((_, idx)=> idx !== i); 
    setCart(c); 
    localStorage.setItem(cartKey, JSON.stringify(c));
    if (user) syncCart(user._id, c);
  }
  
  function checkout(){ nav('/checkout', { state: { promoCode: promo } }); }

  const hasOOSItems = cart.some(item => item.stock === 0);
  const subtotal = cart.reduce((s, it)=> s + (it.price || 0) * (it.qty || 0), 0);

  if (loading) return <div className="flex justify-center py-32"><div className="loader"></div></div>;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 min-h-[80vh]">
      <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8 tracking-tight">Your Cart</h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 animate-in fade-in zoom-in-95">
            <div className="text-6xl mb-4 opacity-50">🛒</div>
            <p className="text-slate-500 text-lg mb-6 font-medium">Your cart is currently empty.</p>
            <Link className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-1" to="/">
              Start Shopping
            </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items List */}
          <div className="flex-1 space-y-6">
            <AnimatePresence mode='popLayout'>
            {cart.map((it, idx)=> {
               const isOOS = it.stock === 0;
               return (
                <motion.div 
                  key={it.bookId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative p-4 rounded-2xl border transition-all hover:shadow-md flex gap-5 items-center bg-white ${isOOS ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}
                >
                  <div className="w-20 h-28 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden shadow-sm">
                    {it.coverImageUrl && (
                        <img src={it.coverImageUrl} alt={it.title} className={`w-full h-full object-cover ${isOOS ? 'grayscale opacity-50' : ''}`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                       <h3 className={`font-serif text-lg font-bold truncate pr-4 ${isOOS ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{it.title}</h3>
                       <button onClick={()=> remove(idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Remove">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                       </button>
                    </div>
                    <p className="text-slate-500 font-medium text-sm mb-4">₹{it.price}</p>
                    
                    <div className="flex items-center justify-between">
                        {isOOS ? (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full uppercase tracking-wide">Out of Stock</span>
                        ) : (
                            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 h-10 w-fit">
                                <button onClick={() => update(idx, it.qty - 1)} disabled={it.qty <= 1} className="px-3 h-full hover:bg-white rounded-l-xl text-slate-500 disabled:opacity-30 transition-colors font-bold">-</button>
                                <div className="px-2 w-8 text-center font-bold text-sm text-slate-900">{it.qty}</div>
                                <button onClick={() => update(idx, it.qty + 1)} disabled={it.qty >= it.stock} className="px-3 h-full hover:bg-white rounded-r-xl text-slate-500 disabled:opacity-30 transition-colors font-bold">+</button>
                            </div>
                        )}
                        <p className="font-bold text-slate-900">₹{it.price * it.qty}</p>
                    </div>
                  </div>
                </motion.div>
               );
            })}
            </AnimatePresence>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:w-96 h-fit sticky top-24">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50">
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-6">Order Summary</h3>
                
                <div className="flex justify-between items-center mb-6 text-slate-600">
                    <span className="font-medium">Subtotal ({cart.length} items)</span>
                    <span className="text-xl font-bold text-slate-900">₹{subtotal}</span>
                </div>
                
                <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Promo Code</label>
                    <div className="relative">
                        <input 
                            placeholder="Enter code" 
                            value={promo} 
                            onChange={e=> setPromo(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase font-medium" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={checkout} 
                    disabled={hasOOSItems || cart.length === 0}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-300 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    Checkout
                </button>
                
                {hasOOSItems && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-xs font-bold">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Please remove out-of-stock items to proceed.
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}