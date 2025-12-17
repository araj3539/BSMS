import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Contexts
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";
import ChatWidget from "./components/ChatWidget";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import BookDetail from "./pages/BookDetail";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminBooks from "./pages/AdminBooks";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminPromotions from "./pages/AdminPromotions";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import Reports from "./pages/Reports";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen bg-slate-50 transition-colors duration-300">
          <ScrollToTop />
          <Header />
          
          {/* FIX APPLIED HERE:
            - pt-36 (144px): Clears the header on Mobile (Logo h-24 + padding)
            - md:pt-48 (192px): Clears the header on Desktop (Logo h-32 + padding)
            This pushes all page content down so it's not hidden behind the logo.
          */}
          <main className="flex-grow pt-36 md:pt-48 px-4 md:px-8 container mx-auto">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/book/:id" element={<BookDetail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Customer Routes */}
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
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/order/:id" element={<AdminOrderDetail />} />
                <Route path="/admin/promotions" element={<AdminPromotions />} />
                <Route path="/admin/logs" element={<AdminAuditLogs />} />
                <Route path="/admin/reports" element={<Reports />} />
              </Route>
            </Routes>
          </main>
          <ChatWidget />
          <Footer />
          <Toaster position="bottom-right" />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;