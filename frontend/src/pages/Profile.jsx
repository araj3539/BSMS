import React, { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import profileService from "../services/profile.service";
import {
  BookOpen,
  ShoppingBag,
  Heart,
  ShoppingCart,
  Wallet,
  Sparkles,
  TrendingUp,
  PenTool,
  Quote,
  Activity,
  Target,
  Lightbulb,
  Bookmark,
  Feather,
} from "lucide-react";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);

  // Address Form State
  const [addrLabel, setAddrLabel] = useState("");
  const [addrText, setAddrText] = useState("");
  const [addingAddr, setAddingAddr] = useState(false);

  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    loadCustomerProfile();
  }, []);

  async function loadCustomerProfile() {
    try {
      const data = await profileService.getCustomerProfile();
      setCustomerProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  }

  // --- ACTIONS ---

  async function handleProfileUpdate(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name cannot be empty");
    setLoading(true);
    try {
      const res = await api.put("/auth/profile", { name });
      updateProfile(res.data.user);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function addAddress(e) {
    e.preventDefault();
    if (!addrLabel || !addrText)
      return toast.error("Please fill in all fields");

    setAddingAddr(true);
    try {
      const res = await api.post("/auth/address", {
        label: addrLabel,
        address: addrText,
      });
      updateProfile(res.data.user);
      setAddrLabel("");
      setAddrText("");
      toast.success("Address added to your book");
    } catch (err) {
      toast.error("Failed to add address");
    } finally {
      setAddingAddr(false);
    }
  }

  async function deleteAddress(id) {
    if (!confirm("Are you sure you want to remove this address?")) return;
    try {
      const res = await api.delete(`/auth/address/${id}`);
      updateProfile(res.data.user);
      toast.success("Address removed");
    } catch (err) {
      toast.error("Failed to delete address");
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- HEADER SECTION --- */}
      <div className="relative mb-12">
        {/* Decorative Background */}
        <div className="h-48 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* User Card */}
        <div className="absolute -bottom-12 left-8 md:left-12 flex items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white p-1.5 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
            <div className="w-full h-full bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-bold text-indigo-600 border border-indigo-100">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
          <div className="mb-3 hidden md:block">
            <h1 className="text-3xl font-serif font-bold text-white drop-shadow-md">
              {user?.name}
            </h1>
            <p className="text-indigo-100 font-medium text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT: PERSONAL INFO --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-serif text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>👤</span> Personal Details
            </h2>

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-100 border border-transparent rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  Email cannot be changed securely.
                </p>
              </div>

              <button
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-600 hover:shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="loader w-4 h-4 border-2 border-white/30 border-t-white"></div>
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </div>

          {/* Stats / Quick Info */}
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-900">
                Member Since
              </span>
              <span className="text-sm font-bold text-indigo-700">
                {new Date(user?.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="h-px bg-indigo-200 w-full"></div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-900">
                Account Type
              </span>
              <span className="text-xs font-bold uppercase bg-white text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* --- RIGHT: ADDRESS BOOK --- */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>📍</span> Address Book
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Manage your shipping destinations.
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {user?.addresses?.length || 0} Saved
              </span>
            </div>

            {/* Address List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <AnimatePresence>
                {user?.addresses?.map((addr) => (
                  <motion.div
                    key={addr._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800 text-sm bg-slate-100 px-2 py-1 rounded group-hover:bg-white transition-colors">
                        {addr.label}
                      </span>
                      <button
                        onClick={() => deleteAddress(addr._id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Delete Address"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pr-6">
                      {addr.address}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {(!user?.addresses || user.addresses.length === 0) && (
                <div className="col-span-1 md:col-span-2 py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <span className="text-4xl mb-3 opacity-50">🗺️</span>
                  <p className="text-slate-500 font-medium">
                    No addresses saved yet.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Add one below for faster checkout.
                  </p>
                </div>
              )}
            </div>

            {/* Add Address Form */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide mb-4">
                Add New Address
              </h4>
              <form
                onSubmit={addAddress}
                className="flex flex-col md:flex-row gap-3"
              >
                <div className="md:w-1/3">
                  <input
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Label (e.g. Home)"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <input
                    value={addrText}
                    onChange={(e) => setAddrText(e.target.value)}
                    placeholder="Full Address (Street, City, Pincode)"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button
                  disabled={addingAddr}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-70 whitespace-nowrap"
                >
                  {addingAddr ? "Adding..." : "Add Address"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ================= AI CUSTOMER PROFILE ================= */}

      <div className="mb-10 relative group">
        {/* Ambient Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-700"></div>

        <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-2xl border border-white/10 overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                <Sparkles className="w-6 h-6 text-indigo-300" />
              </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                AI Customer Profile
              </h2>
            </div>

            <p className="text-indigo-200/80 mb-8 text-lg font-medium">
              Personalized reading insights generated from your activity.
            </p>

            {profileLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
                <p className="text-indigo-200 animate-pulse">
                  Analyzing reading patterns...
                </p>
              </div>
            ) : (
              customerProfile && (
                <div className="space-y-8 mt-8">
                  {/* Stats Grid - Glassmorphism */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      {
                        label: "Reader Level",
                        value: customerProfile.readerLevel,
                        icon: BookOpen,
                        color: "text-blue-300",
                      },
                      {
                        label: "Purchased",
                        value: customerProfile.statistics.booksPurchased,
                        icon: ShoppingBag,
                        color: "text-emerald-300",
                      },
                      {
                        label: "Wishlist",
                        value: customerProfile.statistics.wishlistCount,
                        icon: Heart,
                        color: "text-rose-300",
                      },
                      {
                        label: "In Cart",
                        value: customerProfile.statistics.cartCount,
                        icon: ShoppingCart,
                        color: "text-amber-300",
                      },
                      {
                        label: "Total Spent",
                        value: `₹${Number(customerProfile.statistics.amountSpent).toFixed(2)}`,
                        icon: Wallet,
                        color: "text-purple-300",
                      },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group/stat"
                      >
                        <div className="flex items-center justify-between mb-3 opacity-70 group-hover/stat:opacity-100 transition-opacity">
                          <p className="text-xs font-medium uppercase tracking-wider">
                            {stat.label}
                          </p>
                          <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">
                          {stat.value}
                        </h3>
                      </div>
                    ))}
                  </div>

                  {/* Lists Section */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Favorite Categories */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-lg">Top Categories</h3>
                      </div>
                      <div className="space-y-4">
                        {customerProfile.favoriteCategories.map((cat) => (
                          <div key={cat.category} className="group/item">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-200">
                                {cat.category}
                              </span>
                              <span className="text-indigo-300 font-semibold">
                                {cat.score.toFixed(1)}
                              </span>
                            </div>
                            {/* Visual Score Bar */}
                            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-400 h-1.5 rounded-full transition-all duration-1000 ease-out group-hover/item:opacity-80"
                                style={{
                                  width: `${Math.min((cat.score / 10) * 100, 100)}%`,
                                }} // Assuming score is out of 10, adjust if out of 5 or 100
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Favorite Authors */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                        <PenTool className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-lg">Top Authors</h3>
                      </div>
                      <div className="space-y-4">
                        {customerProfile.favoriteAuthors.map((author) => (
                          <div key={author.author} className="group/item">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-200">
                                {author.author}
                              </span>
                              <span className="text-purple-300 font-semibold">
                                {author.score.toFixed(1)}
                              </span>
                            </div>
                            {/* Visual Score Bar */}
                            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-400 h-1.5 rounded-full transition-all duration-1000 ease-out group-hover/item:opacity-80"
                                style={{
                                  width: `${Math.min((author.score / 10) * 100, 100)}%`,
                                }} // Assuming score is out of 10
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Summary Section */}
                  <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                    <Quote className="absolute -top-2 -left-2 w-16 h-16 text-indigo-500/10 rotate-180" />
                    <div className="relative z-10">
                      <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-indigo-200">
                        <Sparkles className="w-5 h-5" />
                        AI Reading Analysis
                      </h3>
                      <p className="leading-relaxed text-slate-200 text-lg font-light tracking-wide">
                        "{customerProfile.aiSummary}"
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      {customerProfile && (
        <>
          {/* ================= Reading Analytics ================= */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mt-8 relative overflow-hidden group">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Reading Analytics
              </h2>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-center">
              {/* LEFT: Metrics (Takes up slightly more space) */}
              <div className="md:col-span-7 space-y-8">
                {/* Total Interactions */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="flex items-center gap-2 text-slate-500 font-medium">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      Total Interactions
                    </span>
                    <strong className="text-2xl font-bold text-slate-800">
                      {customerProfile.recommendationProfile.totalInteractions}
                    </strong>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out relative"
                      style={{
                        width: `${Math.min(
                          customerProfile.recommendationProfile
                            .totalInteractions,
                          100,
                        )}%`,
                      }}
                    >
                      {/* Shimmer effect on the bar */}
                      <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30 blur-sm"></div>
                    </div>
                  </div>
                </div>

                {/* Recommendation Confidence */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="flex items-center gap-2 text-slate-500 font-medium">
                      <Target className="w-4 h-4 text-emerald-500" />
                      AI Confidence
                    </span>
                    <strong className="text-2xl font-bold text-slate-800">
                      {Math.round(
                        customerProfile.recommendationProfile.confidence * 100,
                      )}
                      %
                    </strong>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out relative"
                      style={{
                        width: `${
                          customerProfile.recommendationProfile.confidence * 100
                        }%`,
                      }}
                    >
                      {/* Shimmer effect on the bar */}
                      <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30 blur-sm"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Explanatory Text Box */}
              <div className="md:col-span-5 h-full">
                <div className="h-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-2xl p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3 text-indigo-700">
                    <Lightbulb className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">How this works</h3>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    Recommendation confidence increases as you interact with the
                    library.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    More{" "}
                    <span className="font-medium text-slate-700">
                      views, ratings, purchases,
                    </span>{" "}
                    and{" "}
                    <span className="font-medium text-slate-700">reviews</span>{" "}
                    help the engine recommend books more accurately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= Favorite Categories ================= */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mt-8 relative overflow-hidden group/card">
            {/* Subtle background blur */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50 rounded-full blur-3xl -z-10 group-hover/card:bg-indigo-50 transition-colors duration-700"></div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Bookmark className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Favorite Categories
              </h2>
            </div>

            <div className="space-y-6">
              {customerProfile.favoriteCategories.map((item, index) => {
                // Array of gradients to cycle through so each bar looks distinct
                const gradients = [
                  "from-indigo-500 to-blue-500",
                  "from-purple-500 to-pink-500",
                  "from-emerald-500 to-teal-500",
                  "from-amber-500 to-orange-400",
                  "from-rose-500 to-red-500",
                ];

                // Pick a gradient based on the item's index
                const gradientClass = gradients[index % gradients.length];

                return (
                  <div key={item.category} className="group">
                    <div className="flex justify-between items-center mb-2.5">
                      {/* Category Name & Rank */}
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-300">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors duration-300">
                          {item.category}
                        </span>
                      </div>

                      {/* Score Bubble */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Score
                        </span>
                        <strong className="text-sm font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm group-hover:border-slate-200 group-hover:shadow transition-all duration-300">
                          {item.score.toFixed(1)}
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-1000 ease-out relative`}
                        style={{
                          width: `${Math.min(item.score * 10, 100)}%`,
                        }}
                      >
                        {/* Inner shimmer effect */}
                        <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-r from-transparent to-white/30 blur-sm"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= Favorite Authors ================= */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mt-8 relative overflow-hidden group/card">
            {/* Subtle background blur */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-50 rounded-full blur-3xl -z-10 group-hover/card:bg-fuchsia-50 transition-colors duration-700"></div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Feather className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Favorite Authors
              </h2>
            </div>

            <div className="space-y-6">
              {customerProfile.favoriteAuthors.map((item, index) => {
                // A distinct array of purple/pink gradients for authors
                const gradients = [
                  "from-purple-600 to-indigo-500",
                  "from-fuchsia-500 to-pink-500",
                  "from-violet-500 to-purple-400",
                  "from-pink-500 to-rose-400",
                  "from-indigo-400 to-purple-500",
                ];

                // Pick a gradient based on the item's index
                const gradientClass = gradients[index % gradients.length];

                return (
                  <div key={item.author} className="group">
                    <div className="flex justify-between items-center mb-2.5">
                      {/* Author Name & Rank */}
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors duration-300">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors duration-300">
                          {item.author}
                        </span>
                      </div>

                      {/* Score Bubble */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Score
                        </span>
                        <strong className="text-sm font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm group-hover:border-slate-200 group-hover:shadow transition-all duration-300">
                          {item.score.toFixed(1)}
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-1000 ease-out relative`}
                        style={{
                          width: `${Math.min(item.score * 10, 100)}%`,
                        }}
                      >
                        {/* Inner shimmer effect */}
                        <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-r from-transparent to-white/30 blur-sm"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
