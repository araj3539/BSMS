import React, { useEffect, useState } from 'react';
import api from "../services/api"; // FIXED: Changed from utils/api to services/api
import { toast } from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch users on load
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (id, currentRole, name) => {
    // Toggle the role
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!window.confirm(`Are you sure you want to change ${name}'s role to ${newRole.toUpperCase()}?`)) return;

    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      toast.success(`User updated to ${newRole}`);
      
      // Update local state immediately
      setUsers(users.map(user => 
        user._id === id ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      setUsers(users.filter((user) => user._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete user');
    }
  };

  if (loading) return <div className="p-4">Loading users...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">User Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Name</th>
              <th className="p-4 font-semibold text-slate-700">Email</th>
              <th className="p-4 font-semibold text-slate-700">Role</th>
              <th className="p-4 font-semibold text-slate-700">Joined Date</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{user.name}</td>
                <td className="p-4 text-slate-600">{user.email}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      user.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}
                  >
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right space-x-2">
                  {/* EDIT ROLE BUTTON */}
                  <button
                    onClick={() => handleRoleUpdate(user._id, user.role, user.name)}
                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs border border-transparent hover:border-indigo-100"
                  >
                    {user.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs border border-transparent hover:border-red-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            
            {users.length === 0 && (
                <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">No users found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}