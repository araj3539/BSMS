import React, { useEffect, useState } from 'react';
import api from "../services/api";
import { toast } from 'react-hot-toast'; // Or your toast library

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
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      // Remove user from local state immediately (faster than re-fetching)
      setUsers(users.filter((user) => user._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete user');
    }
  };

  if (loading) return <div className="p-4">Loading users...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">User Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 font-semibold text-gray-700">Name</th>
              <th className="p-3 font-semibold text-gray-700">Email</th>
              <th className="p-3 font-semibold text-gray-700">Role</th>
              <th className="p-3 font-semibold text-gray-700">Joined Date</th>
              <th className="p-3 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3 font-medium text-gray-900">{user.name}</td>
                <td className="p-3 text-gray-600">{user.email}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            
            {users.length === 0 && (
                <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">No users found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}