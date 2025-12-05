// src/pages/AdminOrders.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { motion } from "framer-motion";
import CustomSelect from "../components/CustomSelect";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState(null); // For Status Modal
  const [newStatus, setNewStatus] = useState("");

  const debouncedQ = useDebounce(q, 500);
  const nav = useNavigate();
  const limit = 20;

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, debouncedQ]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const r = await api.get("/orders", {
        params: { page, limit, status: statusFilter, q: debouncedQ },
      });
      if (r.data.orders) {
        setOrders(r.data.orders);
        setTotal(r.data.total);
      }
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus() {
    if (!selectedOrder) return;
    try {
      await api.put(`/orders/${selectedOrder._id}/status`, {
        status: newStatus,
      });
      toast.success("Status Updated");
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* --- Header --- */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Orders Management</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search ID, Name, Email..."
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm md:text-base"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            placeholder="Filter Status"
            className="w-full sm:w-48"
            options={[
              { value: "", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>
      </div>

      {/* --- Orders List --- */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <motion.div
              key={o._id}
              layout
              className="group bg-white p-4 md:p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-lg md:text-xl shadow-sm flex-shrink-0">
                  📦
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                    <span className="font-mono font-bold text-slate-900 text-sm md:text-lg truncate">
                      #{o._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        STATUS_COLORS[o.status]
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="text-xs md:text-sm text-slate-500 font-medium truncate">
                    {o.userIdName} <span className="hidden sm:inline">• {o.userEmail}</span>
                  </div>
                  <div className="text-[10px] md:text-xs text-slate-400 mt-1">
                    {new Date(o.createdAt).toLocaleDateString()} at{" "}
                    {new Date(o.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 pt-3 border-t md:border-0 border-slate-50 md:pt-0">
                <div className="text-left md:text-right">
                  <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wide">
                    Total
                  </p>
                  <p className="text-lg md:text-xl font-bold text-slate-900">
                    ₹{o.totalAmount}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(o);
                      setNewStatus(o.status);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Update Status"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => nav(`/admin/orders/${o._id}`)}
                    className="bg-slate-900 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all"
                  >
                    Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              No orders found.
            </div>
          )}
        </div>
      )}

      {/* --- Status Modal --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95">
            <h3 className="font-serif font-bold text-xl mb-4 text-slate-900">
              Update Status
            </h3>
            <div className="space-y-2">
              {[
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm capitalize transition-all border ${
                    newStatus === s
                      ? STATUS_COLORS[s] + " ring-1 ring-current"
                      : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}