import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  }

  const navLinkClass = (path) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 block ${
      location.pathname === path
        ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <header className="sticky top-0 z-50 glass transition-all bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="container mx-auto px-4 md:px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Readify Logo"
              className="h-16 md:h-20 w-auto object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/" className={navLinkClass("/")}>
              Home
            </Link>
            <Link to="/cart" className={navLinkClass("/cart")}>
              Cart
            </Link>

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-slate-200 ml-2">
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="text-xs font-bold tracking-wide uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}

                <div className="flex items-center gap-3">
                  {user.role === "customer" && (
                    <>
                      <Link
                        to="/my-orders"
                        className={navLinkClass("/my-orders")}
                      >
                        Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Wishlist"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </Link>
                    </>
                  )}

                  <Link to="/profile" className="flex items-center gap-2 pl-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-md hover:shadow-lg transition-all cursor-pointer">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-600 transition-colors p-2"
                    title="Logout"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-indigo-600 font-medium text-sm px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-indigo-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden shadow-xl"
          >
            <div className="p-4 space-y-4">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={navLinkClass("/")}
              >
                Home
              </Link>
              <Link
                to="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className={navLinkClass("/cart")}
              >
                Cart
              </Link>

              {user ? (
                <div className="space-y-2 border-t border-slate-100 pt-4 mt-2">
                  <div className="flex items-center gap-3 px-4 mb-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {user.role === "customer" && (
                    <>
                      <Link
                        to="/my-orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={navLinkClass("/my-orders")}
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={navLinkClass("/wishlist")}
                      >
                        Wishlist
                      </Link>
                    </>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={navLinkClass("/profile")}
                  >
                    Profile settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 mt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
