import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
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
import ChatWidget from "./components/ChatWidget";
import ScrollToTop from "./components/ScrollToTop"; // <--- IMPORT THIS

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <ScrollToTop /> {/* <--- ADD THIS HERE */}
      
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#1e293b', color: '#fff', borderRadius: '12px' }
      }} />
      
      <Header />
      
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
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>

          {/* Admin Routes */}
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
        <ChatWidget />
      </main>

      <Footer />
    </div>
  );
}