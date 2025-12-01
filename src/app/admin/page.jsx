'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast, ToastContainer } from 'react-toastify'
import Navigation from '../../components/Navigation'
import 'react-toastify/dist/ReactToastify.css'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function AdminDashboard() {
  const [editingUser, setEditingUser] = useState(null)
  const [selectedPrize, setSelectedPrize] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const { data: users, error: usersError, mutate: mutateUsers } = useSWR('/api/users', fetcher)
  const { data: prizes, error: prizesError, mutate: mutatePrizes } = useSWR('/api/prizes', fetcher)
  const { data: spinResults, error: resultsError, mutate: mutateResults } = useSWR('/api/spin-result', fetcher)

  const handleAssignPrize = async () => {
    if (!editingUser || !selectedPrize) {
      toast.error('Pilih hadiah terlebih dahulu')
      return
    }

    setAssigning(true)

    try {
      const response = await fetch(`/api/assigned-prize/${editingUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prizeId: selectedPrize
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Hadiah berhasil ditetapkan untuk user!')
        setEditingUser(null)
        setSelectedPrize('')
        setShowEditModal(false)
        
        // Refresh data
        mutateUsers()
        mutateResults()
      } else {
        toast.error(data.message || 'Gagal menetapkan hadiah')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setAssigning(false)
    }
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setSelectedPrize('')
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setEditingUser(null)
    setSelectedPrize('')
    setShowEditModal(false)
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (usersError || prizesError || resultsError) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-red-600">Error loading data</div>
        </div>
      </>
    )
  }

  if (!users || !prizes || !spinResults) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 p-4">
        <ToastContainer />
        
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Kelola user dan pantau hasil Lucky Wheel</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total User</h3>
              <p className="text-3xl font-bold text-purple-600">{users.length}</p>
              <p className="text-sm text-gray-600">Terdaftar</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">User Sudah Spin</h3>
              <p className="text-3xl font-bold text-green-600">
                {users.filter(user => user.hasSpun).length}
              </p>
              <p className="text-sm text-gray-600">
                {users.filter(user => user.hasSpun).length}/{users.length} user
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Spin</h3>
              <p className="text-3xl font-bold text-blue-600">{spinResults.length}</p>
              <p className="text-sm text-gray-600">Putaran berhasil</p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">User Terdaftar</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telepon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hadiah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    // Find user's spin result if exists
                    const userSpinResult = spinResults.find(result => result.userId === user._id)
                    
                    return (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {user.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.hasSpun ? (
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                              Sudah Spin
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                              Belum Spin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {userSpinResult ? (
                            <div className="flex flex-col space-y-1">
                              <span 
                                className="px-2 py-1 rounded-full text-white text-xs font-medium inline-block"
                                style={{ backgroundColor: userSpinResult.prizeId_obj?.color || '#999' }}
                              >
                                {userSpinResult.prizeName}
                              </span>
                              {userSpinResult.isAssigned && (
                                <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
                                  Admin Assigned
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada user terdaftar
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    value={editingUser.phone}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode
                  </label>
                  <input
                    type="text"
                    value={editingUser.code}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex items-center">
                    {editingUser.hasSpun ? (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                        Sudah Spin
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                        Belum Spin
                      </span>
                    )}
                  </div>
                </div>

                {!editingUser.hasSpun && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tetapkan Hadiah (Opsional)
                    </label>
                    <select
                      value={selectedPrize}
                      onChange={(e) => setSelectedPrize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      <option value="">-- Pilih Hadiah --</option>
                      {prizes.map(prize => (
                        <option key={prize._id} value={prize._id}>
                          {prize.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeEditModal}
                    className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200"
                  >
                    Batal
                  </button>
                  {!editingUser.hasSpun && (
                    <button
                      onClick={handleAssignPrize}
                      disabled={assigning || !selectedPrize}
                      className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assigning ? 'Menetapkan...' : 'Tetapkan Hadiah'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}