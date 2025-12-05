import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../components/CustomSelect";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  payment_pending: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => {
        // Handle both Array (User) and Object (Admin) responses safely
        let orderData = [];
        if (Array.isArray(res.data)) {
          orderData = res.data;
        } else if (res.data && Array.isArray(res.data.orders)) {
          orderData = res.data.orders;
        }
        setOrders(orderData);
        setFilteredOrders(orderData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let res = orders;
    if (statusFilter !== "all")
      res = res.filter((o) => o.status === statusFilter);
    if (search) {
      const lower = search.toLowerCase();
      res = res.filter(
        (o) =>
          o._id.includes(lower) ||
          o.items.some((i) => i.title.toLowerCase().includes(lower))
      );
    }
    setFilteredOrders(res);
  }, [statusFilter, search, orders]);

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <div className="loader"></div>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-6 min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">
            My Orders
          </h2>
          <p className="text-sm md:text-base text-slate-500 mt-1 font-medium">
            Track your purchase history
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
             <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-sm"
            />
          </div>

          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-40"
            options={[
              { value: "all", label: "All Orders" },
              { value: "pending", label: "Pending" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-24 bg-white/60 rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-lg font-medium">No orders found.</p>
          <button
            onClick={() => {
              setStatusFilter("all");
              setSearch("");
            }}
            className="text-indigo-600 font-bold mt-2 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={order._id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group"
              >
                {/* Order Header */}
                <div className="bg-slate-50/80 px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="bg-white p-1.5 md:p-2 rounded-lg border border-slate-200 shadow-sm">
                      <span className="font-mono font-bold text-slate-800 tracking-wider text-xs md:text-sm">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] md:text-xs text-slate-500 font-medium">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <span
                      className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wide border ${
                        STATUS_COLORS[order.status] || "bg-gray-100"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                    <Link
                      to={`/order/${order._id}`}
                      className="text-indigo-600 text-xs md:text-sm font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Details &rarr;
                    </Link>
                  </div>
                </div>

                {/* Items & Total */}
                <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1 space-y-2 w-full">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-slate-400 font-bold text-xs md:text-sm flex-shrink-0">
                            x{item.qty}
                          </span>
                          <span className="text-slate-700 font-medium truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-slate-900 font-bold text-xs md:text-sm pl-2">
                          ₹{item.price * item.qty}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[10px] md:text-xs text-slate-400 font-medium pl-6 md:pl-8">
                        + {order.items.length - 2} more items
                      </p>
                    )}
                  </div>

                  <div className="w-full md:w-auto text-right border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-8 flex justify-between md:block items-center">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider mb-0 md:mb-1">
                      Total Amount
                    </p>
                    <p className="text-xl md:text-2xl font-serif font-bold text-slate-900">
                      ₹{order.totalAmount}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}