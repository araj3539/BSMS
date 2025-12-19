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
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from "recharts";


function fillMissingDates(data, days) {
  const result = [];
  const today = new Date();
  
  // Iterate backwards from today
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Check if API returned data for this specific date
    const existing = data.find(item => item._id === dateStr);
    
    // Use existing data OR push a zero-entry
    result.push(existing || { _id: dateStr, total: 0, orders: 0 });
  }
  return result;
}

export default function Reports() {
  const [salesByDay, setSalesByDay] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [days, setDays] = useState(30); // State for time range

  useEffect(() => {
    fetchReport(days);
    fetchCategoryStats();
  }, [days]);

  function fetchReport(d) {
    api
      .get(`/reports/sales-by-day?days=${d}`)
      .then((r) => setSalesByDay(r.data))
      .catch(() => {});
  }

  function fetchCategoryStats() {
    api.get('/reports/category-sales')
       .then(r => setCategoryData(r.data))
       .catch(err => console.error(err));
  }

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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
            <LineChart data={fillMissingDates(salesByDay, days)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left: The Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
          <h4 className="font-serif text-lg font-bold text-slate-800 mb-2">Sales by Category</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60} // Makes it a "Donut" chart (modern look)
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `₹${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Right: The Details List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 overflow-y-auto custom-scrollbar">
           <h4 className="font-serif text-lg font-bold text-slate-800 mb-4">Category Breakdown</h4>
           <div className="space-y-4">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="font-medium text-slate-700">{cat.name || 'Uncategorized'}</span>
                   </div>
                   <span className="font-bold text-slate-900">₹{cat.value.toLocaleString()}</span>
                </div>
              ))}
              {categoryData.length === 0 && <p className="text-slate-400 text-center py-10">No sales data yet.</p>}
           </div>
        </div>
      </div>      
    </div>
    
  );
}