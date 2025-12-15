import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Section */}
        <div className="space-y-4">
          <Link to="/" className="inline-block group">
             <img 
               src="/logo.png" 
               alt="Readify" 
               className="h-20 w-auto object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" 
             />
          </Link>
          <p className="text-sm leading-relaxed text-slate-400">
            Your destination for curated bestsellers, timeless classics, and hidden gems. Delivered straight to your door.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-indigo-400 transition-colors">All Books</Link></li>
            <li><Link to="/cart" className="hover:text-indigo-400 transition-colors">Shopping Cart</Link></li>
            <li><Link to="/wishlist" className="hover:text-indigo-400 transition-colors">My Wishlist</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/profile" className="hover:text-indigo-400 transition-colors">My Account</Link></li>
            <li><Link to="/my-orders" className="hover:text-indigo-400 transition-colors">Order Status</Link></li>
            <li><span className="cursor-pointer hover:text-indigo-400 transition-colors">Privacy Policy</span></li>
            <li><span className="cursor-pointer hover:text-indigo-400 transition-colors">Terms of Service</span></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Stay Updated</h4>
          <p className="text-xs text-slate-400 mb-3">Subscribe for the latest releases and exclusive offers.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500" 
            />
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-900/20">
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-6">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Readify. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Instagram</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Facebook</span>
          </div>
        </div>
      </div>
    </footer>
  );
}