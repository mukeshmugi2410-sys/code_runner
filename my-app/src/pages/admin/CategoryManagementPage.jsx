import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState({
    id: null,
    name: '',
    description: '',
    image: '',
    status: 'active'
  });
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get('http://localhost:5000/api/categories', { headers });
      setCategories(res.data?.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentCategory({ id: null, name: '', description: '', image: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setModalMode('edit');
    setCurrentCategory({
      id: cat.id,
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      status: cat.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (cat) => {
    setCategoryToDelete(cat);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!currentCategory.name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/api/categories', {
          name: currentCategory.name,
          description: currentCategory.description,
          image: currentCategory.image
        }, { headers });
        setSuccessMsg('Category created successfully!');
      } else {
        await axios.put(`http://localhost:5000/api/categories/${currentCategory.id}`, {
          name: currentCategory.name,
          description: currentCategory.description,
          image: currentCategory.image,
          status: currentCategory.status
        }, { headers });
        setSuccessMsg('Category updated successfully!');
      }

      setIsModalOpen(false);
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.error || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`http://localhost:5000/api/categories/${categoryToDelete.id}`, { headers });
      setSuccessMsg('Category deleted successfully!');
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.error || 'Failed to delete category.');
      setIsDeleteModalOpen(false);
    }
  };

  const toggleStatus = async (cat) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const newStatus = cat.status === 'inactive' ? 'active' : 'inactive';

      await axios.put(`http://localhost:5000/api/categories/${cat.id}`, {
        ...cat,
        status: newStatus
      }, { headers });

      setCategories(categories.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update category status.');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      
      {/* Admin Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="p-6 space-y-6">
          <div>
            <Link to="/" className="text-xl font-extrabold tracking-wider text-indigo-500">
              CODE RUNNER
            </Link>
            <span className="block text-[10px] text-gray-500 uppercase tracking-widest mt-1">Admin Command Center</span>
          </div>

          <nav className="space-y-1 text-xs">
            {[
              { label: '📊 Dashboard', path: '/admin' },
              { label: '👥 User Management', path: '/admin/users' },
              { label: '💻 Course Management', path: '/admin/courses' },
              { label: '📂 Category Management', path: '/admin/categories', active: true },
              { label: '🗺️ Roadmap Management', path: '/admin/roadmaps' },
              { label: '🎓 Enrollment Management', path: '/admin/enrollments' },
              { label: '💳 Payment Management', path: '/admin/payments' },
              { label: '🏆 Certificate Management', path: '/admin/certificates' },
              { label: '📈 Reports & Analytics', path: '/admin/reports' },
            ].map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`block px-4 py-2.5 rounded-xl font-semibold transition ${
                  item.active ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-900 text-center">
          <Link to="/dashboard" className="text-xs text-indigo-400 hover:underline">← Exit to Student View</Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div>
            <div className="text-xs text-gray-400">Admin / Categories</div>
            <h1 className="text-lg font-bold text-white mt-0.5">Category Management</h1>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            + Add Category
          </button>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          {/* Search Bar & Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-800 border border-gray-700 p-4 rounded-2xl shadow">
            <div className="w-full md:w-96">
              <input
                type="text"
                placeholder="Search categories by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-gray-400">
              Total Categories: <span className="font-bold text-white">{categories.length}</span>
            </div>
          </div>

          {/* Category Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400 animate-pulse">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">No categories found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-900/60 border-b border-gray-700 text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="p-4">Image</th>
                      <th className="p-4">Category Name</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-750 transition">
                        <td className="p-4">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover rounded-lg border border-gray-700" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-[10px] text-gray-500 border border-gray-700">
                              N/A
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-white">{cat.name}</td>
                        <td className="p-4 text-gray-400 max-w-xs truncate">{cat.description || 'No description provided.'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            cat.status === 'inactive' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {cat.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => toggleStatus(cat)}
                            className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-[10px] font-semibold transition"
                            title="Toggle Status"
                          >
                            {cat.status === 'inactive' ? 'Activate' : 'Deactivate'}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-semibold transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(cat)}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-semibold transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <h3 className="text-sm font-bold text-white">
                {modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Artificial Intelligence"
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Summary of what this category entails..."
                  value={currentCategory.description}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={currentCategory.image}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, image: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {modalMode === 'edit' && (
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Status</label>
                  <select
                    value={currentCategory.status}
                    onChange={(e) => setCurrentCategory({ ...currentCategory, status: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  {modalMode === 'add' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
              !
            </div>
            <h3 className="text-sm font-bold text-white">Delete Category</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to delete <span className="font-bold text-white">{categoryToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3 pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}