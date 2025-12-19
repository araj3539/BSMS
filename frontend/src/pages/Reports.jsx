import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area
} from "recharts";

function fillMissingDates(data, days) {
  const result = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const existing = data.find(item => item._id === dateStr);
    result.push(existing || { _id: dateStr, total: 0, orders: 0 });
  }
  return result;
}

export default function Reports() {
  const [salesByDay, setSalesByDay] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [days, setDays] = useState(30); 

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
  const chartData = fillMissingDates(salesByDay, days);

  const totalRevenue = salesByDay.reduce((acc, curr) => acc + curr.total, 0);
  const totalOrders = salesByDay.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div className="max-w-7xl mx-auto pb-24 px-4 sm:px-6"> 
      {/* Added pb-24 to fix footer overlap */}
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 mt-6">
        <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Analytics</h2>
            <p className="text-slate-500 text-sm mt-1">Performance metrics for the last {days} days</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex shadow-sm">
            {[7, 30, 90].map(d => (
                <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        days === d 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    {d} Days
                </button>
            ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <SummaryCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} color="text-indigo-600" />
         <SummaryCard title="Total Orders" value={totalOrders} color="text-emerald-600" />
         <SummaryCard 
            title="Avg. Order Value" 
            value={`₹${totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}`} 
            color="text-amber-600" 
         />
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <h4 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Revenue Trend
        </h4>
        <div style={{ width: "100%", height: 350, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="_id" 
                tickFormatter={(str) => str.slice(5)} // Show MM-DD only
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                labelStyle={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="total" name="Revenue (₹)" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left: The Pie Chart */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[420px]">
          <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
             <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
             Sales by Category
          </h4>
          <div className="flex-1 w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                >
                    {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: The Details List */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-[420px] flex flex-col">
           <h4 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
             <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
             Category Breakdown
           </h4>
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="font-semibold text-slate-700">{cat.name || 'Uncategorized'}</span>
                   </div>
                   <div className="text-right">
                       <span className="block font-bold text-slate-900">₹{cat.value.toLocaleString()}</span>
                   </div>
                </div>
              ))}
              {categoryData.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 italic">
                    No sales data available for this period.
                </div>
              )}
           </div>
        </div>
      </div>      
    </div>
  );
}

function SummaryCard({ title, value, color }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
            <p className={`text-3xl font-bold ${color} tracking-tight`}>{value}</p>
        </div>
    )
}