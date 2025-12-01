'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const fetcher = (url) => fetch(url).then((res) => res.json())


export default function DashboardPage() {

  const [loading, setLoading] = useState(false);



  const [refreshInterval, setRefreshInterval] = useState(3000) // 3 seconds
  const { data: spinResults, error: resultsError, mutate: mutateResults } = useSWR(
    '/api/spin-result',
    fetcher,
    {
      refreshInterval: refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  const { data: users, error: usersError, mutate: mutateUsers } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users?limit=1000`, // Get all users for dashboard
    fetcher,
    {
      refreshInterval: refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getRecentSpins = () => {
    if (!spinResults || !Array.isArray(spinResults)) return []
    const now = new Date()
    const fiveTeenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
    return spinResults.filter(result => {
      if (!result.spinTime) return false
      return new Date(result.spinTime) > fiveTeenMinutesAgo
    })
  }

  const getTodayStats = () => {
    if (!spinResults || !Array.isArray(spinResults)) return { total: 0, assigned: 0, random: 0 }

    const today = new Date().toDateString()
    const todayResults = spinResults.filter(result => {
      if (!result.spinTime) return false
      return new Date(result.spinTime).toDateString() === today
    })

    return {
      total: todayResults.length,
      assigned: todayResults.filter(r => r.isAssigned).length,
      random: todayResults.filter(r => !r.isAssigned).length
    }
  }

  useEffect(() => {
    // Auto refresh when new spin is detected
    const recentSpins = getRecentSpins()
    if (recentSpins.length > 0) {
      // Show notification for new spins
      const latestSpin = recentSpins[0]
      if (latestSpin.spinTime) {
        const timeDiff = new Date() - new Date(latestSpin.spinTime)

        if (timeDiff < 3000) { // If spin happened within last 5 seconds
          const userName = latestSpin.userId?.name || 'User'
          const prizeName = latestSpin.prizeId?.name || latestSpin.prizeName || 'Hadiah'
          toast.info(`🎉 ${userName} mendapatkan ${prizeName}!`, {
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
          })
        }
      }
    }
  }, [spinResults])

  if (resultsError || usersError) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-red-600">Error loading data</div>
        </div>
      </>
    )
  }

  if (!spinResults || !users) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      </>
    )
  }

  // Ensure spinResults is an array
  const spinResultsArray = Array.isArray(spinResults) ? spinResults : []
  const recentSpins = getRecentSpins()
  const todayStats = getTodayStats()

  // Handle new API structure
  const usersArray = users?.users || (Array.isArray(users) ? users : [])
  const totalUsers = usersArray.length
  const usersSpun = usersArray.filter(user => user.hasSpun).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
              <p className="text-gray-600">Monitor Lucky Wheel secara real-time</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total User Hari Ini</h3>
            <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
            <p className="text-xs text-gray-500">Terdaftar</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">User Sudah Spin</h3>
            <p className="text-2xl font-bold text-gray-800">{usersSpun}</p>
            <p className="text-xs text-gray-500">{((usersSpun / totalUsers) * 100).toFixed(1)}% dari total</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Spin Hari Ini</h3>
            <p className="text-2xl font-bold text-gray-800">{todayStats.total}</p>
            <p className="text-xs text-gray-500">Putaran berhasil</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Spin Terakhir</h3>
            <p className="text-lg font-bold text-gray-800">
              {spinResultsArray.length > 0 && spinResultsArray[0].spinTime 
                ? 'Pukul ' + formatTime(spinResultsArray[0].spinTime).split(',')[1] + ' WIB'
                : 'Belum ada'}
            </p>
            <p className="text-xs text-gray-500">
              {spinResultsArray.length > 0 
                ? spinResultsArray[0].userId?.name || '-' 
                : '-'}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Spins */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Aktivitas Terbaru</h2>
              <button
                onClick={() => {
                  mutateResults()
                  mutateUsers()
                  toast.success('Data refreshed!')
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentSpins.length > 0 ? (
                recentSpins.map((result, index) => (
                  <div
                    key={result._id || index}
                    className={`border-l-4 p-3 rounded-r-lg ${index === 0 ? 'bg-green-50 border-green-500' : 'hidden'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {result.userId?.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Kode: {result.userId?.code || '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className="px-2 py-1 rounded-full text-white text-xs font-medium"
                          style={{ backgroundColor: result.prizeId?.color || '#999' }}
                        >
                          {result.prizeId?.name || result.prizeName || 'Unknown Prize'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {result.spinTime ? formatTime(result.spinTime).split(',')[1] : '-'}
                        </p>
                      </div>
                    </div>
                    {result.isAssigned && (
                      <div className="mt-2">
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          Admin Assigned
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">🎯</div>
                  <p>Tidak ada aktivitas dalam 15 menit terakhir</p>
                </div>
              )}
            </div>
          </div>

          {/* Today's Prize Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Distribusi Hadiah Hari Ini</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Admin Assigned</span>
                <span className="text-lg font-bold text-purple-600">{todayStats.assigned}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="text-lg font-bold text-blue-600">{todayStats.total}</span>
              </div>
            </div>

            {/* Prize Breakdown */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Breakdown Hadiah:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {todayStats.total > 0 ? (
                  Object.entries(
                    spinResultsArray.filter(result => {
                      if (!result.spinTime) return false
                      return new Date(result.spinTime).toDateString() === new Date().toDateString()
                    }).reduce((acc, result) => {
                      const prizeName = result.prizeId?.name || result.prizeName || 'Unknown Prize'
                      acc[prizeName] = (acc[prizeName] || 0) + 1
                      return acc
                    }, {}) || {}
                  ).map(([prizeName, count]) => (
                    <div key={prizeName} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{prizeName}</span>
                      <span className="font-medium text-gray-800">{count}x</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 text-sm">Belum ada data hari ini</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
}