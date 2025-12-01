'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { toast, ToastContainer } from 'react-toastify';
import Navigation from '@/components/Navigation';
import 'react-toastify/dist/ReactToastify.css';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function DaftarUserPage() {
  const [users, setUsers] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [spinResults, setSpinResults] = useState([]);
  const [assignedPrizes, setAssignedPrizes] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedPrize, setSelectedPrize] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  // SWR hooks for real-time data
  const { data: usersData, error: usersError, mutate: mutateUsers } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users?limit=1000`,
    fetcher,
    { 
      refreshInterval: 2000, // Refresh setiap 2 detik
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  const { data: prizesData, error: prizesError, mutate: mutatePrizes } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prizes`,
    fetcher,
    { 
      refreshInterval: 3000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  const { data: spinResultsData, error: spinResultsError, mutate: mutateSpinResults } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/spin-result`,
    fetcher,
    { 
      refreshInterval: 2000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  const { data: assignedPrizesData, error: assignedPrizesError, mutate: mutateAssignedPrizes } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assigned-prizes`,
    fetcher,
    { 
      refreshInterval: 2000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  // Update local state when SWR data changes
  useEffect(() => {
    if (usersData?.users) {
      setUsers(usersData.users);
    }
  }, [usersData]);

  useEffect(() => {
    if (prizesData) {
      // API returns {prizes: [...]}, so extract the array
      const prizesArray = prizesData.prizes || (Array.isArray(prizesData) ? prizesData : []);
      setPrizes(prizesArray);
    }
  }, [prizesData]);

  useEffect(() => {
   
    if (spinResultsData) {
      setSpinResults(spinResultsData);
    }
  
  }, [spinResultsData]);

  useEffect(() => {
    if (assignedPrizesData) {
      setAssignedPrizes(assignedPrizesData);
    }
  
  }, [assignedPrizesData]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedUsers([]); // Clear selection when changing page
    }
  };

  // Handle select all (only select visible/filtered users)
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle select individual user
  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Pilih user yang akan dihapus');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedUsers.length} user?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds: selectedUsers })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${selectedUsers.length} user berhasil dihapus`);
        setSelectedUsers([]);
        
        // Trigger real-time update
        mutateUsers();
        mutateSpinResults();
        mutateAssignedPrizes();
      } else {
        toast.error(data.message || 'Gagal menghapus user');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
    
    // Check if user has assigned prize
    const assignedPrize = assignedPrizes[user._id];
    if (assignedPrize) {
      setSelectedPrize(assignedPrize.prizeId);
    }
  };

  // Handle assign prize
  const handleAssignPrize = async () => {
    if (!editingUser || !selectedPrize) {
      toast.error('Pilih hadiah terlebih dahulu');
      return;
    }

    setAssigning(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assigned-prize/${editingUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prizeId: selectedPrize
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Hadiah berhasil ditetapkan untuk user!');
        setEditingUser(null);
        setSelectedPrize('');
        setShowEditModal(false);
        
        // Trigger real-time update
        mutateUsers();
        mutateSpinResults();
        mutateAssignedPrizes();
      } else {
        toast.error(data.message || 'Gagal menetapkan hadiah');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setAssigning(false);
    }
  };

  // Get user's spin status
  const getUserSpinStatus = (userId) => {
    // Check both user.hasSpun and spinResults for accuracy
    const user = users.find(u => u._id === userId);
    const hasSpinResult = spinResults.some(result => result.userId === userId);
    return user?.hasSpun || hasSpinResult || false;
  };

  const getUserAssignedPrize = (userId) => {
    const safePrize = (prizeId, prizeName) => ({
      _id: prizeId || 'unknown',
      name: prizeName || 'Hadiah Tidak Ditemukan',
      color: '#999' // fallback supaya tidak error
    });
  
    // admin assigned prize
    const assignedPrize = assignedPrizes[userId];
    if (assignedPrize) {
      const prize = prizes.find(p => p._id === assignedPrize.prizeId);
      return {
        ...assignedPrize,
        prize: prize || safePrize(assignedPrize.prizeId, assignedPrize.prizeName)
      };
    }
  
    // spin result assigned
    const spinAssigned = spinResults.find(r => r.userId === userId && r.isAssigned);
    if (spinAssigned) {
      const prize = prizes.find(p => p._id === spinAssigned.prizeId);
      return {
        userId,
        prizeId: spinAssigned.prizeId,
        prize: prize || safePrize(spinAssigned.prizeId, spinAssigned.prizeName),
        prizeName: spinAssigned.prizeName,
        isAssigned: true
      };
    }
  
    // random spin result (NOT assigned)
    const randomSpin = spinResults.find(r => r.userId === userId && !r.isAssigned);
    if (randomSpin) {
      const prize = prizes.find(p => p._id === randomSpin.prizeId);
      return {
        userId,
        prizeId: randomSpin.prizeId,
        prize: prize || safePrize(randomSpin.prizeId, randomSpin.prizeName),
        prizeName: randomSpin.prizeName,
        isAssigned: false
      };
    }
  
    return null;
  };

  // Get global index for numbering
  const getGlobalIndex = (index) => {
    return (currentPage - 1) * USERS_PER_PAGE + index + 1;
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const nameMatch = user.name?.toLowerCase().includes(searchLower);
    const codeMatch = user.code?.toLowerCase().includes(searchLower);
    const emailMatch = user.email?.toLowerCase().includes(searchLower);
    
    return nameMatch || codeMatch || emailMatch;
  });

  // Calculate total users and pages based on filtered results
  const totalFilteredUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalFilteredUsers / USERS_PER_PAGE) || 1;

  // Reset to page 1 if current page is out of bounds after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Calculate paginated users from filtered results
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Prepare CSV headers
      const headers = ['No', 'Nama', 'Email', 'Telepon', 'Kode', 'Status Spin', 'Hadiah', 'Tanggal Registrasi'];
      
      // Prepare CSV rows
      const rows = filteredUsers.map((user, index) => {
        const hasSpun = getUserSpinStatus(user._id);
        const assignedPrize = getUserAssignedPrize(user._id);
        const prizeName = assignedPrize?.prize?.name || assignedPrize?.prizeName || '-';
        const registeredDate = user.registeredAt 
          ? new Date(user.registeredAt).toLocaleDateString('id-ID')
          : '-';
        
        return [
          index + 1,
          user.name || '',
          user.email || '',
          user.phone || '',
          user.code || '',
          hasSpun ? 'Sudah Spin' : 'Belum Spin',
          prizeName,
          registeredDate
        ];
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Add BOM for UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `daftar-user-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Berhasil export ${filteredUsers.length} user ke CSV`);
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Gagal export ke CSV');
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      // Dynamic import jsPDF
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Set font
      doc.setFont('helvetica');
      
      // Title
      doc.setFontSize(18);
      doc.text('Daftar User', 14, 15);
      
      // Date
      doc.setFontSize(10);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);
      doc.text(`Total: ${filteredUsers.length} user`, 14, 27);
      
      // Table headers
      const headers = ['No', 'Nama', 'Email', 'Telepon', 'Kode', 'Status', 'Hadiah'];
      const colWidths = [15, 50, 60, 40, 25, 30, 50];
      let startY = 35;
      const rowHeight = 8;
      const initialX = 14;
      
      // Helper function to draw header
      const drawHeader = (y) => {
        let x = initialX;
        doc.setFillColor(79, 70, 229); // Purple color
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        headers.forEach((header, i) => {
          doc.rect(x, y, colWidths[i], rowHeight, 'F');
          // Center text in cell
          const textX = x + colWidths[i] / 2;
          doc.text(header, textX, y + 5, { align: 'center' });
          x += colWidths[i];
        });
      };
      
      // Draw initial header
      drawHeader(startY);
      
      // Draw rows
      startY += rowHeight;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      filteredUsers.forEach((user, index) => {
        // Check if we need a new page
        if (startY > 180) {
          doc.addPage();
          startY = 15;
          
          // Redraw header on new page
          drawHeader(startY);
          startY += rowHeight;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        const hasSpun = getUserSpinStatus(user._id);
        const assignedPrize = getUserAssignedPrize(user._id);
        const prizeName = assignedPrize?.prize?.name || assignedPrize?.prizeName || '-';
        
        const rowData = [
          (index + 1).toString(),
          user.name || '',
          user.email || '',
          user.phone || '',
          user.code || '',
          hasSpun ? 'Sudah' : 'Belum',
          prizeName.length > 20 ? prizeName.substring(0, 20) + '...' : prizeName
        ];
        
        let x = initialX;
        rowData.forEach((cell, i) => {
          // Alternate row color
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(x, startY, colWidths[i], rowHeight, 'F');
          }
          
          // Truncate long text
          let displayText = cell;
          if (cell.length > 25 && i > 0) {
            displayText = cell.substring(0, 25) + '...';
          }
          
          doc.text(displayText, x + 2, startY + 5);
          x += colWidths[i];
        });
        
        startY += rowHeight;
      });
      
      // Save PDF
      doc.save(`daftar-user-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`Berhasil export ${filteredUsers.length} user ke PDF`);
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Gagal export ke PDF. Pastikan library jsPDF terinstall.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Daftar User</h1>
          <p className="text-gray-600">Kelola user yang sudah terdaftar</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau kode..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center space-x-4">
              {selectedUsers.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200"
                >
                  Hapus ({selectedUsers.length})
                </button>
              )}
              <div className="text-sm text-gray-600">
                {searchTerm ? (
                  <span>
                    Menampilkan {totalFilteredUsers} dari {users.length} user
                  </span>
                ) : (
                  <span>Total: {users.length} user</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Export Data</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                disabled={filteredUsers.length === 0}
                className="flex items-center space-x-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export CSV</span>
              </button>
              <button
                onClick={exportToPDF}
                disabled={filteredUsers.length === 0}
                className="flex items-center space-x-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Memuat data...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={paginatedUsers.length > 0 && paginatedUsers.every(user => selectedUsers.includes(user._id))}
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
                        Email
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
                    {paginatedUsers.map((user, index) => {
                      const hasSpun = getUserSpinStatus(user._id);
                      const assignedPrize = getUserAssignedPrize(user._id);
                      const globalIndex = getGlobalIndex(index);
                      
                      return (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user._id)}
                              onChange={(e) => handleSelectUser(user._id, e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{globalIndex}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {hasSpun ? (
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
                            {assignedPrize ? (
                              <span 
                                className="px-2 py-1 rounded-full text-xs text-white"
                                style={{ backgroundColor: assignedPrize.prize.color || '#999' }}
                              >
                                {assignedPrize.prize.name}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleEditUser(user)}
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
              </div>
              
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Tidak ada user yang cocok dengan pencarian' : 'Belum ada user terdaftar'}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    {totalFilteredUsers > 0 ? (
                      <span>
                        Menampilkan {((currentPage - 1) * USERS_PER_PAGE) + 1} hingga {Math.min(currentPage * USERS_PER_PAGE, totalFilteredUsers)} dari {totalFilteredUsers} user
                        {searchTerm && ` (dari ${users.length} total)`}
                      </span>
                    ) : (
                      <span>Tidak ada data</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>

                    {/* Page Numbers */}
                    {getPaginationNumbers().map((page, index) => (
                      <div key={index}>
                        {page === '...' ? (
                          <span className="px-3 py-1 text-sm text-gray-500">...</span>
                        ) : (
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                              currentPage === page
                                ? 'bg-purple-600 text-white'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hadiah</label>
                <select
                  value={selectedPrize}
                  onChange={(e) => setSelectedPrize(e.target.value)}
                  className="w-full px-3 py-2 border-none focus:outline-none  rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Pilih hadiah...</option>
                  {Array.isArray(prizes) && prizes.length > 0 ? (
                    prizes
                      .filter(prize => prize.isActive !== false)
                      .map((prize) => (
                        <option
                        key={prize._id}
                        value={prize._id}
                        style={{
                          backgroundColor: prize.color,   // warna dari database
                          color: "white",
                                       // biar teks tetap terlihat
                        }}
                      >
                        {prize.name}
                      </option>
                      ))
                  ) : (
                    <option value="" disabled>Loading prizes...</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setSelectedPrize('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleAssignPrize}
                disabled={assigning}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? 'Menetapkan...' : 'Tetapkan Hadiah'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}