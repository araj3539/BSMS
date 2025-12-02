// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer"; // <--- Import Footer
import Home from "./pages/Home";
import BookDetail from "./pages/BookDetail";
import Cart from "./pages/Cart";
import OrderDetail from "./pages/OrderDetail";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBooks from "./pages/AdminBooks";
import AdminPromotions from "./pages/AdminPromotions";
import Reports from "./pages/Reports";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import MyOrders from './pages/MyOrders';
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { Toaster } from 'react-hot-toast';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import AdminAuditLogs from "./pages/AdminAuditLogs";

export default function App() {
  return (
    // Changed layout to flex-col to support sticky footer
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#1e293b', color: '#fff', borderRadius: '12px' }
      }} />
      
      <Header />
      
      {/* flex-grow ensures this section takes up all available space */}
      <main className="container mx-auto p-4 md:px-6 flex-grow w-full max-w-7xl">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Routes (Logged-in users only) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>

          {/* Admin Routes (Admin users only) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/books" element={<AdminBooks />} />
            <Route path="/admin/promotions" element={<AdminPromotions />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/logs" element={<AdminAuditLogs />} />
          </Route>
        </Routes>
      </main>

      {/* Footer added at the bottom */}
      <Footer />
    </div>
  );
}