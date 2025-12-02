'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR, { mutate } from 'swr'

import Image from 'next/image'
import LuckyWheelNew from '@/components/LuckyWheelNew'
import { toast } from 'react-toastify'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function WheelPage() {
  const [userCode, setUserCode] = useState('')
  const [userData, setUserData] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [assignedPrize, setAssignedPrize] = useState(null)
  const [spinResult, setSpinResult] = useState(null)
  const finishAudioRef = useRef(null)

  const [error, setError] = useState(false);


  // SWR hooks for real-time data
  const { data: spinResults, error: resultsError} = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/spin-result`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  const { data: users, error: usersError} = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users?limit=1000`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  // Initialize finish audio
  useEffect(() => {
    finishAudioRef.current = new Audio('/finish.mp3')
    finishAudioRef.current.volume = 0.5 // Set volume to 50%

    return () => {
      if (finishAudioRef.current) {
        finishAudioRef.current.pause()
        finishAudioRef.current = null
      }
    }
  }, [])

  // Play finish sound when spin result appears
  useEffect(() => {
    if (spinResult && finishAudioRef.current) {
      finishAudioRef.current.currentTime = 0 // Reset to start
      finishAudioRef.current.play().catch(err => {
        // Ignore audio play errors (user interaction required)
        console.log('Finish audio play error:', err)
      })
    }
  }, [spinResult])



  const handleCodeSubmit = async (e) => {
    e.preventDefault()

    
    try {

      if(!e.target.value){
        toast.error("mohon masukkan kode")
        return ;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${userCode}`)
      const data = await response.json()

     
  
      if (response.ok) {
        setUserData(data)

        // Check if user has assigned prize
        const prizeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assigned-prize/${data._id}`)
        const prizeData = await prizeResponse.json()

        if (prizeResponse.ok && prizeData.prize) {
          setAssignedPrize(prizeData.prize)       
        }

        if(data.hasSpun === false){
          setIsSpinning(true)
        }

        // Refresh data to get latest status
        mutate(spinResults, users) // Refresh spin results
      } else {
        toast.error(data.message || 'Kode tidak ditemukan')
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleSpinComplete = async (prize) => {
    setSpinResult(prize)
    setIsSpinning(false)

    // Save spin result to database
    try {


      // Prize now comes with _id from database
      const prizeId = prize._id || prize.id

      if (!prizeId) {
        console.error('Prize ID not found:', prize)
        alert('Terjadi kesalahan: Prize ID tidak ditemukan')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData._id,
          prizeId: prizeId,
          prizeName: prize.name,
          isAssigned: !!assignedPrize
        })
      })

      const result = await response.json()


      if (!response.ok) {
        console.error('Save failed:', result)
        alert('Gagal menyimpan hasil putaran: ' + (result.message || 'Unknown error'))
      } else {
        console.log('Save successful!')
        // Success! Refresh data to show real-time updates
        mutate(spinResults, users) // Refresh spin results
   
      }
    } catch (error) {
      console.error('Error saving spin result:', error)
      alert('Terjadi kesalahan saat menyimpan hasil: ' + error.message)
    }
  }

  

  const resetForm = () => {
    setUserCode('')
    setUserData(null)
    setAssignedPrize(null)
    setSpinResult(null)
    setIsSpinning(false)
  }

  if (spinResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Selamat! {userData ? `${userData.name}` : ''}</h1>
            <p className="text-xl text-gray-600 mb-4">Anda mendapatkan:</p>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-6 mb-6">
              <div className="text-2xl font-bold">{spinResult.name}</div>
            </div>
            <button
              onClick={resetForm}
              className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition duration-200"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col justify-center items-center w-full mb-3">
          <Image src="/goodluck.png" alt="Logo" width={400} height={400} />
          <div className="text-center mb-6 w-full sm:w-3/5">
              <h2 className={`text-xl font-semibold text-gray-800 mx-auto px-4 w-full   rounded-2xl ${userData ? ' bg-white py-2 shadow-lg shadow-black/20' : 'hidden'}`}>
                {userData ? `${userData.name}` : ''}
                {userData && userData.hasSpun && (
                <p className="text-red-500 font-semibold mt-2">Kode tidak valid atau sudah digunakan</p>
              )}
              </h2>
            </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-12 items-center'>
          {/* Lucky Wheel Section */}
          <div className={`p-4 antialiased ${userData && userData.hasSpun === false ? 'col-span-12' : 'col-span-12 md:col-span-8'}`}>
            

            <LuckyWheelNew
              onSpinComplete={handleSpinComplete}
              assignedPrize={assignedPrize}
              isSpinning={isSpinning}
            />

        
            {userData && userData.hasSpun === false && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">User Terverifikasi!</h3>
                <div className="text-sm text-green-700">
                  <p><strong>Nama:</strong> {userData.name}</p>
                  <p><strong>Email:</strong> {userData.email}</p>
                  <p><strong>Kode:</strong> {userData.code}</p>
                  <p><strong>Status:</strong> {userData.hasSpun ? 'Sudah Spin' : <span className="text-gray-800 bg-yellow-300 px-2 py-1 rounded-full">Belum Spin</span>}</p>
                </div>
              </div>
            )}
          </div>

          {/* Verification Form Section */}
          <div className={`mx-auto bg-white rounded-2xl shadow-2xl p-4 transition-all  ${userData && userData.hasSpun === false ? '' : 'col-span-12 md:col-span-4'}`}>
            <p className='text-center pb-4 text-gray-600 font-semibold text-sm'>Masukkan Kode</p>
            <form onSubmit={handleCodeSubmit} className="space-y-6 w-full">
              <div>
                <input
                  type="text"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.toUpperCase())}
               
                  className="w-full px-4 py-3 border placeholder:text-sm placeholder:text-gray-500  border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-purple-600 text-center text-xl font-bold tracking-wider"
                  placeholder="123A"
                  maxLength={4}
                />
               
              </div>
              <button
                type=''
                disabled={isSpinning}
                className={`font-bold py-3 px-8 rounded-lg w-full  ${ userData?.hasSpun && userData?.hasSpun === false
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-b from-yellow-500 to-orange-600 text-white  cursor-pointer text-white hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 '
                  }`}
              >
                {isSpinning ? 'MEMUTAR...' : 'PUTAR'}
              </button>
            </form>
            
          </div>
        </div>
      </div>
    </div>
  )
}