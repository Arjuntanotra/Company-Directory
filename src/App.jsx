import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Phone, MapPin, Lock, Unlock, RefreshCw, Plus, Edit2, Trash2, Upload, Filter, X } from 'lucide-react';
import * as XLSX from 'xlsx';


const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz15Axb66RnDkc55i2czAfLT-lkOPKjvCDzr1GO3nl2wWv6P3S6M2391sf4GhSPflg64A/exec';
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
  const [form, setForm] = useState({ location: '', extension: '', username: '', area: '' });
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [visibleItems, setVisibleItems] = useState(25); // Start with 25 items
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fileRef = useRef();
  const observerRef = useRef();

  // Load data from Google Sheets via Apps Script
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${WEB_APP_URL}?action=read`);
      const result = await res.json();

      if (result.success) {
        console.log('Fetched data:', result.data);
        const dataWithIndex = result.data.map((item, index) => ({ ...item, index }));
        setData(dataWithIndex);
      } else {
        console.log('Failed to load data:', result.error);
        alert('Failed to load data: ' + result.error);
      }
    } catch (err) {
      alert('Error loading data: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Filter data by search and areas
  let filtered = data;
  if (search) {
    filtered = filtered.filter(e =>
      String(e.username || '').toLowerCase().includes(search.toLowerCase()) ||
      String(e.extension || '').toLowerCase().includes(search.toLowerCase()) ||
      String(e.location || '').toLowerCase().includes(search.toLowerCase()) ||
      String(e.area || '').toLowerCase().includes(search.toLowerCase())
    );
  }
  if (selectedAreas.length > 0) {
    filtered = filtered.filter(e => selectedAreas.includes(e.area));
  }
  if (selectedLocations.length > 0) {
    filtered = filtered.filter(e => selectedLocations.includes(e.location));
  }

  // Reset visible items when search or filters change
  useEffect(() => {
    setVisibleItems(25);
  }, [search, selectedAreas, selectedLocations]);

  // Infinite scroll logic
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || visibleItems >= filtered.length) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleItems(prev => Math.min(prev + 25, filtered.length));
      setIsLoadingMore(false);
    }, 500); // Small delay for smooth UX
  }, [isLoadingMore, visibleItems, filtered.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleItems < filtered.length) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [loadMoreItems, visibleItems, filtered.length]);


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
      formData.append('area', form.area);

      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (result.success) {
        alert('Entry added successfully!');
        setShowModal(false);
        setForm({ location: '', extension: '', username: '', area: '' });
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
      formData.append('area', form.area);

      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (result.success) {
        alert('Entry updated successfully!');
        setShowModal(false);
        setForm({ location: '', extension: '', username: '', area: '' });
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

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonArray = XLSX.utils.sheet_to_json(worksheet);

      // Log the actual column names found in the file
      if (jsonArray.length > 0) {
        const columnNames = Object.keys(jsonArray[0]);
        console.log('Column names found in file:', columnNames);
      }

      const filteredData = jsonArray.map(row => ({
        location: String(row.location || row.Location || row.loc || row.Loc || '').trim(),
        extension: String(row.extension || row.Extension || row.ext || row.Ext || row['Extension number'] || '').trim(),
        username: String(row.username || row.Username || row.name || row.Name || row.employee || row.Employee || row['User name'] || '').trim(),
        area: String(row.area || row.Area || '').trim(),
      })).filter(entry => entry.username && entry.extension); // Basic validation: require username, extension, area

      console.log('Original data rows:', jsonArray.length);
      console.log('Filtered valid rows:', filteredData.length);
      console.log('Sample row mappings:', jsonArray.slice(0, 3).map(row => ({
        original: row,
        mapped: {
          location: String(row.location || row.Location || row.loc || row.Loc || '').trim(),
          extension: String(row.extension || row.Extension || row.ext || row.Ext || '').trim(),
          username: String(row.username || row.Username || row.name || row.Name || row.employee || row.Employee || '').trim(),
        }
      })));

      if (filteredData.length === 0) {
        alert('No valid data found in the file. Ensure columns contain username/name, extension/ext, and location data. Supported column names: username/name/employee/"User name", extension/ext/"Extension number", location/loc');
        return;
      }

      const confirm = window.confirm(`Import ${filteredData.length} entries?`);
      if (confirm) {
        bulkUpload(filteredData);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Bulk upload function - optimized for speed
  const bulkUpload = async (entries) => {
    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    const batchSize = 10; // Process 10 entries at a time

    // Process entries in batches
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const batchPromises = batch.map(entry => {
        const formData = new URLSearchParams();
        formData.append('action', 'add');
        formData.append('location', entry.location);
        formData.append('extension', entry.extension);
        formData.append('username', entry.username);
        formData.append('area', entry.area);

        return fetch(WEB_APP_URL, { method: 'POST', body: formData })
          .then(res => res.json())
          .then(result => result.success ? 1 : 0)
          .catch(() => 0);
      });

      // Wait for all requests in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      successCount += batchResults.filter(result => result === 1).length;
      failCount += batchResults.filter(result => result === 0).length;
    }

    setLoading(false);
    loadData();
    alert(`Bulk upload completed!\nAdded: ${successCount}\nSkipped/Failed: ${failCount}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50">
      <div className="max-w-[95vw] mx-auto px-6 py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <img src="logo.jpeg" alt="Rashmi Metaliks Limited Logo" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Rashmi Metaliks Limited</h1>
                <p className="text-slate-600 text-lg font-medium">Intercom Directory</p>
                <p className="text-slate-500 text-sm mt-1">Access to company contacts and extensions</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                Refresh Data
              </button>
              <button
                onClick={() => isAdmin ? setIsAdmin(false) : handleAdminLogin()}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isAdmin ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-700 text-white hover:bg-slate-800'
                  }`}
              >
                {isAdmin ? <Unlock size={20} /> : <Lock size={20} />}
                {isAdmin ? 'Admin Active' : 'Admin Login'}
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-emerald-800 font-semibold">
                  Administrative Access Enabled
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3 md:mb-0 md:mr-2">Search Directory</label>
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={22} />
                <input
                  type="text"
                  placeholder="Search employees by name, extension, or location..."
                  className="w-full h-12 pl-12 pr-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-800 placeholder-slate-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowFilterModal(prev => !prev)}
                className="h-12 px-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all duration-200 flex items-center gap-2 justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                <Filter size={20} />
                Filters
              </button>
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-4 lg:min-w-fit">
              <button
                onClick={() => {
                  setShowModal(true);
                  setEditingIndex(null);
                  setForm({ location: '', extension: '', username: '' });
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-semibold"
              >
                <Plus size={20} />
                Add Employee
              </button>
              <button
                onClick={() => fileRef.current.click()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-semibold"
              >
                <Upload size={20} />
                Bulk Import
              </button>
              <input
                type="file"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
              />
            </div>
          )}
          {showFilterModal && (
            <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
                <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600">Close</button>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search filters..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    onChange={(e) => { /* filter logic for options */ }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Area</label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {[...new Set(data.map(e => e.area).filter(Boolean))].sort().map(area => (
                      <label key={area} className="flex items-center space-x-2">
                        <input type="checkbox" checked={selectedAreas.includes(area)} onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAreas([...selectedAreas, area]);
                          } else {
                            setSelectedAreas(selectedAreas.filter(a => a !== area));
                          }
                        }} />
                        <span className="text-sm">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Location</label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {[...new Set(data.map(e => e.location).filter(Boolean))].sort().map(location => (
                      <label key={location} className="flex items-center space-x-2">
                        <input type="checkbox" checked={selectedLocations.includes(location)} onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLocations([...selectedLocations, location]);
                          } else {
                            setSelectedLocations(selectedLocations.filter(l => l !== location));
                          }
                        }} />
                        <span className="text-sm">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setSelectedAreas([]); setSelectedLocations([]); }} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 text-sm font-semibold">Clear All</button>
                <button onClick={() => setShowFilterModal(false)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-semibold">Apply</button>
              </div>
            </div>
          )}
          <div className="mt-6 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-medium">
                Total Employees: <span className="text-slate-800 font-bold">{data.length}</span>
              </span>
              <span className="text-slate-600 font-medium">
                Showing: <span className="text-slate-800 font-bold">{filtered.length}</span>
              </span>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(search ? filtered : filtered.slice(0, visibleItems)).map((entry, idx) => (
            <div key={idx} className={`bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-300 group overflow-hidden ${isAdmin ? 'min-h-[400px]' : ''}`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">{entry.username}</h3>
                      <p className="text-slate-500 text-sm font-medium">Employee</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEdit(entry)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Employee"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Employee"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <a
                    href={`tel:${entry.extension}`}
                    className="block group/contact"
                  >
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover/contact:bg-blue-200 transition-colors">
                        <Phone size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Extension</div>
                        <div className="font-mono font-bold text-lg text-slate-800">{entry.extension}</div>
                      </div>
                    </div>
                  </a>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Area</div>
                      <div className="text-sm font-semibold text-slate-800">{entry.area || 'Not Specified'}</div>
                    </div>
                  </div>
                  {entry.location && (
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <MapPin size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Location</div>
                        <div className="text-sm font-semibold text-slate-800">{entry.location}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Infinite Scroll Trigger */}
        {visibleItems < filtered.length && (
          <div ref={observerRef} className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
              <span className="text-sm font-medium">Loading more employees...</span>
            </div>
          </div>
        )}

        {/* Load More Button (Fallback) */}
        {visibleItems < filtered.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMoreItems}
              disabled={isLoadingMore}
              className="px-8 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading...' : `Load More (${filtered.length - visibleItems} remaining)`}
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No employees found</h3>
            <p className="text-slate-500">Try adjusting your search criteria or clear the search to see all employees.</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full border border-slate-200">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Plus size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingIndex !== null ? 'Edit Employee' : 'Add New Employee'}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {editingIndex !== null ? 'Update employee information' : 'Enter new employee details'}
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Employee Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Extension Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={form.extension}
                    onChange={(e) => setForm({ ...form, extension: e.target.value })}
                    placeholder="e.g., 701"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Area</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder="e.g., IT, HR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Location</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g., A13, Office"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setForm({ location: '', extension: '', username: '' });
                    setEditingIndex(null);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 font-semibold"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={editingIndex !== null ? handleUpdate : handleAdd}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingIndex !== null ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-slate-200">
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              © 2025 Rashmi Metaliks Limited. Enterprise Employee Directory System
            </p>
          </div>
        </footer>

        {/* Watermark */}
        <div className="fixed bottom-6 right-8 pointer-events-none select-none z-10">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200">
            <div className="text-slate-600 text-sm font-semibold">
              Developed by Arjun Tanotra
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
