import React, { useState, useEffect } from 'react';
import { Search, Phone, MapPin, Lock, Unlock, RefreshCw, Plus, Edit2, Trash2 } from 'lucide-react';


const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx5SJm00xKHTIShxzrl7VKj4KadjtaInTM_T97JNiJTm7d6WJH68zd1Tt5k4x36W9Qg/exec';
const ADMIN_PASSWORDS = process.env.REACT_APP_ADMIN_PASSWORDS
  ? process.env.REACT_APP_ADMIN_PASSWORDS.split(',')
  : [];

function App() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({ location: '', extension: '', username: '' });

  // Load data from Google Sheets via Apps Script
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${WEB_APP_URL}?action=read`);
      const result = await res.json();
      
      if (result.success) {
        const dataWithIndex = result.data.map((item, index) => ({ ...item, index }));
        setData(dataWithIndex);
      } else {
        alert('Failed to load data: ' + result.error);
      }
    } catch (err) {
      alert('Error loading data: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Filter data by search
  const filtered = data.filter(e =>
  String(e.username || '').toLowerCase().includes(search.toLowerCase()) ||
  String(e.extension || '').toLowerCase().includes(search.toLowerCase()) ||
  String(e.location || '').toLowerCase().includes(search.toLowerCase())
);


  // Admin login
  const handleAdminLogin = () => {
    const pwd = prompt('Enter admin password:');
    if (ADMIN_PASSWORDS.includes(pwd)) {
      setIsAdmin(true);
      alert('Admin access granted!');
    } else {
      alert('Invalid password!');
    }
  };

  // Add new entry
  const handleAdd = async () => {
    if (!form.location || !form.extension || !form.username) {
      alert('All fields required!');
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'add');
      formData.append('location', form.location);
      formData.append('extension', form.extension);
      formData.append('username', form.username);

      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (result.success) {
        alert('Entry added successfully!');
        setShowModal(false);
        setForm({ location: '', extension: '', username: '' });
        loadData();
      } else {
        alert('Failed to add entry: ' + result.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  // Update entry
  const handleUpdate = async () => {
    if (!form.location || !form.extension || !form.username) {
      alert('All fields required!');
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'update');
      formData.append('rowIndex', editingIndex);
      formData.append('location', form.location);
      formData.append('extension', form.extension);
      formData.append('username', form.username);

      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (result.success) {
        alert('Entry updated successfully!');
        setShowModal(false);
        setForm({ location: '', extension: '', username: '' });
        setEditingIndex(null);
        loadData();
      } else {
        alert('Failed to update entry: ' + result.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  // Delete entry
  const handleDelete = async (index) => {
    if (!window.confirm('Delete this entry from Google Sheet?')) return;

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'delete');
      formData.append('rowIndex', index);

      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (result.success) {
        alert('Entry deleted successfully!');
        loadData();
      } else {
        alert('Failed to delete entry: ' + result.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  // Open edit modal
  const openEdit = (entry) => {
    setForm({ location: entry.location, extension: entry.extension, username: entry.username });
    setEditingIndex(entry.index);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Rashmi Metaliks Limited's Directory</h1>
              <p className="text-gray-600">Quick access to employee</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => isAdmin ? setIsAdmin(false) : handleAdminLogin()}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isAdmin ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                }`}
              >
                {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
                {isAdmin ? 'Admin' : 'User'}
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✅ Admin Mode</strong> 
              </p>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, extension, or location..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => { 
                  setShowModal(true); 
                  setEditingIndex(null); 
                  setForm({ location: '', extension: '', username: '' }); 
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus size={20} />
                Add
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Showing {filtered.length} of {data.length} contacts
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((entry, idx) => (
            <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{entry.username}</h3>
                    <p className="text-sm text-gray-500">Employee</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(entry)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <a
                  href={`tel:${entry.extension}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer group">
                    <Phone size={20} className="text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="text-xs text-blue-700 font-medium">Extension</div>
                      <div className="font-mono font-bold text-xl text-blue-800">{entry.extension}</div>
                    </div>
                  </div>
                </a>
                {entry.location && (
                  <div className="flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                    <MapPin size={20} className="text-green-600 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-green-700 font-medium">Location</div>
                      <div className="text-sm font-semibold text-green-800">{entry.location}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500">No results found</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">
                {editingIndex !== null ? 'Edit Entry' : 'Add New Entry'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border rounded-lg"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g., A13, Office"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Extension</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border rounded-lg"
                    value={form.extension}
                    onChange={(e) => setForm({ ...form, extension: e.target.value })}
                    placeholder="e.g., 701"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border rounded-lg"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { 
                    setShowModal(false); 
                    setForm({ location: '', extension: '', username: '' }); 
                    setEditingIndex(null); 
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={editingIndex !== null ? handleUpdate : handleAdd}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
