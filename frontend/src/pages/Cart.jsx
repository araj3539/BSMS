import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext'; // Import AuthContext

export default function Cart(){
  const [cart, setCart] = useState([]);
  const [promo, setPromo] = useState('');
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { user } = useAuth(); // Get User

  // Dynamic Cart Key
  const cartKey = user ? `cart_${user._id}` : 'cart_guest';

  // Validate cart items with backend on mount
  useEffect(() => {
    const localCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    if (localCart.length === 0) {
      setCart([]);
      setLoading(false);
      return;
    }

    const ids = localCart.map(item => item.bookId);
    
    api.post('/books/batch', { ids })
      .then(res => {
        const books = res.data; // Fresh data from DB
        let updatedCart = [];
        let changes = false;

        localCart.forEach(cartItem => {
          const book = books.find(b => b._id === cartItem.bookId);
          
          if (!book) {
            changes = true; // Book deleted
            return; 
          }

          // Update price/stock info
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
        
        if (changes) {
          toast('Cart updated based on availability.', { icon: '⚠️' });
        }
      })
      .catch(err => {
        console.error("Failed to validate cart", err);
        setCart(localCart); 
      })
      .finally(() => setLoading(false));

  }, [user, cartKey]); // Dependency ensures reload on login/logout

  function update(i, qty){
    const c = [...cart]; 
    const item = c[i];
    const max = item.stock || 1; 
    const newQty = Math.min(Math.max(1, Number(qty)), max);
    
    item.qty = newQty; 
    setCart(c); 
    localStorage.setItem(cartKey, JSON.stringify(c));
  }

  function remove(i){
    const c = cart.filter((_, idx)=> idx !== i); 
    setCart(c); 
    localStorage.setItem(cartKey, JSON.stringify(c));
  }
  
  function checkout(){ 
    nav('/checkout', { state: { promoCode: promo } }); 
  }

  const hasOOSItems = cart.some(item => item.stock === 0);
  const subtotal = cart.reduce((s, it)=> s + (it.price || 0) * (it.qty || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><div className="loader"></div></div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h2 className="text-3xl font-serif font-bold text-slate-900 mb-8">Your Cart</h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-lg mb-4">Your cart is currently empty.</p>
            <Link className="text-indigo-600 font-semibold hover:underline" to="/">Continue Shopping</Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {cart.map((it, idx)=> {
               const isOOS = it.stock === 0;
               return (
                <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm border transition-all hover:shadow-md flex justify-between items-center ${isOOS ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    {it.coverImageUrl && (
                        <img src={it.coverImageUrl} alt={it.title} className={`w-16 h-20 object-cover rounded-md ${isOOS ? 'grayscale opacity-50' : ''}`} />
                    )}
                    <div>
                      <div className={`font-serif text-lg font-bold ${isOOS ? 'text-slate-500 line-through decoration-red-500' : 'text-slate-900'}`}>
                        {it.title}
                      </div>
                      <div className="text-slate-500">₹{it.price}</div>
                      {isOOS && <span className="text-xs font-bold text-red-600 uppercase tracking-wide bg-red-100 px-2 py-0.5 rounded">Out of Stock</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {!isOOS && (
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button 
                            onClick={() => update(idx, it.qty - 1)}
                            disabled={it.qty <= 1}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-l-lg disabled:opacity-30 transition-colors text-slate-600"
                        >
                            -
                        </button>
                        <div className="w-10 h-8 flex items-center justify-center font-semibold text-sm text-slate-900">
                            {it.qty}
                        </div>
                        <button 
                            onClick={() => update(idx, it.qty + 1)}
                            disabled={it.qty >= it.stock}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-r-lg disabled:opacity-30 transition-colors text-slate-600"
                        >
                            +
                        </button>
                        </div>
                    )}
                    
                    <button onClick={()=> remove(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" title="Remove">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
               );
            })}
          </div>

          {/* Summary & Promo */}
          <div className="lg:w-80 h-fit bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-xl font-bold text-slate-900">₹{subtotal}</span>
            </div>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Have a promo code?</label>
                <input 
                    placeholder="Coupon Code" 
                    value={promo} 
                    onChange={e=> setPromo(e.target.value)} 
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
                <p className="text-xs text-slate-400 mt-2">Enter it here to apply at checkout.</p>
            </div>

            <button 
                onClick={checkout} 
                disabled={hasOOSItems || cart.length === 0}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {hasOOSItems ? 'Remove OOS Items' : 'Proceed to Checkout'}
            </button>
            {hasOOSItems && <p className="text-xs text-red-500 text-center mt-2">Please remove out of stock items to proceed.</p>}
          </div>
        </div>
      )}
    </div>
  );
}