import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const isActive = (path) => location.pathname === path ? "text-indigo-600 font-medium" : "text-slate-500 hover:text-slate-900";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-serif font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
            BookShop.
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/cart" className={isActive('/cart')}>Cart</Link>
          
          {user ? (
            <div className="flex items-center gap-6 pl-6 border-l border-slate-200">
              {user.role === "admin" && (
                <Link to="/admin" className="text-xs font-semibold tracking-wide uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100">
                  Admin Dashboard
                </Link>
              )}
              
              <div className="flex items-center gap-4">
                 {user.role === "customer" && (
                    <>
                      <Link to="/my-orders" className={isActive('/my-orders')}>Orders</Link>
                      <Link to="/wishlist" className={isActive('/wishlist')}>Wishlist</Link>
                    </>
                 )}
                 <Link to="/profile" className="flex items-center gap-2 hover:opacity-80">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                 </Link>
                 <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium">Log in</Link>
              <Link to="/signup" className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}