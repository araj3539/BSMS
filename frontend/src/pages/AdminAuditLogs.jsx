import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then(res => setLogs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50 border-red-100';
    if (action.includes('UPDATE')) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (action.includes('CREATE')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    return 'text-indigo-600 bg-indigo-50 border-indigo-100';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-slate-900">Security Audit Logs</h2>
        <p className="text-slate-500 mt-1">Monitor administrative actions and system security.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><div className="loader"></div></div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Action</th>
                  <th className="p-4">Admin / User</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {logs.map((log) => (
                  <motion.tr 
                    key={log._id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{log.userId?.name || log.userName || 'System'}</div>
                      <div className="text-xs text-slate-400">{log.userRole} • {log.ip || 'Unknown IP'}</div>
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-500 font-mono text-xs">
                      {log.endpoint}
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}