import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Reports() {
  const [salesByDay, setSalesByDay] = useState([]);
  const [days, setDays] = useState(30); // State for time range

  useEffect(() => {
    fetchReport(days);
  }, [days]);

  function fetchReport(d) {
    api
      .get(`/reports/sales-by-day?days=${d}`)
      .then((r) => setSalesByDay(r.data))
      .catch(() => {});
  }

  // Calculate totals for the summary cards
  const totalRevenue = salesByDay.reduce((acc, curr) => acc + curr.total, 0);
  const totalOrders = salesByDay.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-serif font-bold text-slate-900">Sales Analytics</h2>
        
        {/* Time Range Selector */}
        <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
            {[7, 30, 90].map(d => (
                <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${
                        days === d 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    {d} Days
                </button>
            ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalOrders}</p>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Avg. Order Value</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
                ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}
            </p>
         </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8" style={{ minHeight: "400px" }}>
        <h4 className="font-serif text-lg font-bold text-slate-800 mb-6">Revenue Trend</h4>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
              />
              <Legend />
              <Line type="monotone" dataKey="total" name="Revenue (₹)" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}