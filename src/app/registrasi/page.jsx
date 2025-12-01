'use client';

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function RegistrasiPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  // SWR untuk real-time data users
  const { data: users, error, mutate: mutateUsers } = useSWR(
    '/api/users?limit=1000',
    fetcher,
    { 
      refreshInterval: 2000, // Refresh setiap 2 detik
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('API Response:', data);
        setRegistrationSuccess(data?.user);
        setFormData({ name: '', email: '', phone: '' });
        
        // Trigger real-time update
        mutateUsers();
      } else {
        alert(data.message || 'Registrasi gagal');
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRegistration = () => {
    setRegistrationSuccess(null);
  };

  // Show success card with user code
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Success Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Registrasi Berhasil!</h1>
            </div>

            {/* User Info Card */}
            <div className="p-6">
                    <p className="text-md text-center mb-3">KODE ANDA</p>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border-dashed border-2 border-gray-600">
                <div className="text-center ">
                  <div className="inline-block px-6 py-3 rounded-lg mb-4">
                    <p className="text-4xl text-purple-600  font-extrabold ">{registrationSuccess.code}</p>
                  </div>
                 
                </div>
                
                
              </div>

              {/* Instructions */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-purple-800 mb-2">📋 Cara Menggunakan Kode:</h3>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Screenshot atau simpan halaman ini</li>
                  <li>2. Kunjungi stand Lucky Wheel</li>
                  <li>3. Tunjukan kode kepada crew</li>
                  <li>4. Crew akan memverifikasi kode</li>
                  <li>5. Spin dan menangkan hadiah!</li>
                </ol>
              </div>

              {/* Success Message Only */}
              <div className="text-center">
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 002 2v6a2 2 0 002-2h-2z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lucky Wheel Event</h1>
          <p className="text-gray-600">Daftar sekarang untuk kesempatan menang hadiah!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Masukkan email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Telepon
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 001.21.502l4.493-1.498a1 1 0 00.684-.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6a5 5 0 015 5v2a2 2 0 002 2z"></path>
              </svg>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Masukkan nomor telepon"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Sudah punya kode?{' '}
            <button 
              onClick={() => window.location.href = '/wheel'}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Main Lucky Wheel
            </button>
          </p>
          <p className="text-sm text-gray-600">
            <button 
              onClick={() => window.location.href = '/daftar-user'}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Dashboard Admin
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}