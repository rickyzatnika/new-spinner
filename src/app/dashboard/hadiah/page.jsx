'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { toast, ToastContainer } from 'react-toastify';
import Navigation from '@/components/Navigation';
import 'react-toastify/dist/ReactToastify.css';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function HadiahPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#FF6B6B',
    probability: 10,
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPrizes, setSelectedPrizes] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);

  // SWR hook for real-time data
  const { data: prizesData, error: prizesError, mutate: mutatePrizes } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prizes`,
    fetcher,
    { 
      refreshInterval: 3000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  // Extract prizes array from API response
  const prizes = prizesData?.prizes || (Array.isArray(prizesData) ? prizesData : []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  // Handle add prize
  const handleAddPrize = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Nama hadiah harus diisi');
      return;
    }

    if (formData.probability < 0 || formData.probability > 100) {
      toast.error('Probability harus antara 0-100');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prizes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          probability: formData.probability
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Hadiah berhasil ditambahkan!');
        setShowAddModal(false);
        setFormData({
          name: '',
          description: '',
          color: '#FF6B6B',
          probability: 10,
          isActive: true
        });
        
        // Trigger real-time update
        mutatePrizes();
      } else {
        toast.error(data.message || 'Gagal menambahkan hadiah');
      }
    } catch (error) {
      console.error('Error adding prize:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit prize
  const handleEditPrize = (prize) => {
    setEditingPrize(prize);
    setFormData({
      name: prize.name || '',
      description: prize.description || '',
      color: prize.color || '#FF6B6B',
      probability: prize.probability || 10,
      isActive: prize.isActive !== false
    });
    setShowEditModal(true);
  };

  // Handle update prize
  const handleUpdatePrize = async (e) => {
    e.preventDefault();
    
    if (!editingPrize) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Nama hadiah harus diisi');
      return;
    }

    if (formData.probability < 0 || formData.probability > 100) {
      toast.error('Probability harus antara 0-100');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prizes/${editingPrize._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          probability: formData.probability,
          isActive: formData.isActive
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Hadiah berhasil diperbarui!');
        setShowEditModal(false);
        setEditingPrize(null);
        setFormData({
          name: '',
          description: '',
          color: '#FF6B6B',
          probability: 10,
          isActive: true
        });
        
        // Trigger real-time update
        mutatePrizes();
      } else {
        toast.error(data.message || 'Gagal memperbarui hadiah');
      }
    } catch (error) {
      console.error('Error updating prize:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total probability
  const totalProbability = prizes.reduce((sum, prize) => sum + (prize.probability || 0), 0);

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPrizes(prizes.map(prize => prize._id));
    } else {
      setSelectedPrizes([]);
    }
  };

  // Handle select individual prize
  const handleSelectPrize = (prizeId, checked) => {
    if (checked) {
      setSelectedPrizes(prev => [...prev, prizeId]);
    } else {
      setSelectedPrizes(prev => prev.filter(id => id !== prizeId));
    }
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteClick = () => {
    if (selectedPrizes.length === 0) {
      toast.error('Pilih hadiah yang akan dihapus');
      return;
    }
    setShowDeleteModal(true);
  };

  // Handle bulk delete execution
  const handleBulkDelete = async () => {
    setShowDeleteModal(false);
    setDeleting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prizes/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prizeIds: selectedPrizes })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${selectedPrizes.length} hadiah berhasil dihapus`);
        setSelectedPrizes([]);
        
        // Trigger real-time update
        mutatePrizes();
      } else {
        toast.error(data.message || 'Gagal menghapus hadiah');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daftar Hadiah</h1>
            <p className="text-gray-600">Kelola hadiah yang tersedia di Lucky Wheel</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Prize</span>
          </button>
        </div>

        {/* Statistics Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Hadiah</h3>
            <p className="text-2xl font-bold text-gray-800">{prizes.length}</p>
            <p className="text-xs text-gray-500">Hadiah aktif</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Probability</h3>
            <p className="text-2xl font-bold text-gray-800">{totalProbability}%</p>
            <p className="text-xs text-gray-500">
              {totalProbability === 100 ? 'Perfect!' : totalProbability > 100 ? 'Over 100%' : 'Under 100%'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Hadiah Aktif</h3>
            <p className="text-2xl font-bold text-gray-800">
              {prizes.filter(p => p.isActive !== false).length}
            </p>
            <p className="text-xs text-gray-500">Dari {prizes.length} total</p>
          </div>
        </div>

        {/* Action Bar */}
        {selectedPrizes.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">
                {selectedPrizes.length} hadiah dipilih
              </span>
              <button
                onClick={handleBulkDeleteClick}
                disabled={deleting}
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{deleting ? 'Menghapus...' : `Hapus (${selectedPrizes.length})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Prizes Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {prizesError ? (
            <div className="text-center py-8 text-red-600">
              Error loading prizes: {prizesError.message}
            </div>
          ) : prizes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🎁</div>
              <p>Belum ada hadiah terdaftar</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200"
              >
                Tambah Hadiah Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={prizes.length > 0 && prizes.every(prize => selectedPrizes.includes(prize._id))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warna
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prizes.map((prize, index) => (
                    <tr key={prize._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPrizes.includes(prize._id)}
                          onChange={(e) => handleSelectPrize(prize._id, e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {prize.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {prize.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: prize.color }}
                          ></div>
                          <span className="text-gray-600">{prize.color}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{prize.probability || 0}%</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${prize.probability || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {prize.isActive !== false ? (
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditPrize(prize)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Edit
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

      {/* Edit Prize Modal */}
      {showEditModal && editingPrize && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Hadiah</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPrize(null);
                  setFormData({
                    name: '',
                    description: '',
                    color: '#FF6B6B',
                    probability: 10,
                    isActive: true
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdatePrize} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Hadiah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Contoh: Voucher 50K"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Deskripsi hadiah (opsional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="#FF6B6B"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Probability (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="probability"
                  value={formData.probability}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Peluang hadiah ini muncul (0-100%)
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Aktif</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPrize(null);
                    setFormData({
                      name: '',
                      description: '',
                      color: '#FF6B6B',
                      probability: 10,
                      isActive: true
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Memperbarui...' : 'Perbarui Hadiah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Prize Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Hadiah Baru</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    name: '',
                    description: '',
                    color: '#FF6B6B',
                    probability: 10,
                    isActive: true
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddPrize} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Hadiah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Contoh: Voucher 50K"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Deskripsi hadiah (opsional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="#FF6B6B"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Probability (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="probability"
                  value={formData.probability}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Peluang hadiah ini muncul (0-100%)
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      description: '',
                      color: '#FF6B6B',
                      probability: 10,
                      isActive: true
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Menambahkan...' : 'Tambah Hadiah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Konfirmasi Hapus
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Apakah Anda yakin ingin menghapus <span className="font-semibold text-red-600">{selectedPrizes.length}</span> hadiah yang dipilih?
            </p>
            
            <p className="text-sm text-gray-500 text-center mb-6">
              Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

