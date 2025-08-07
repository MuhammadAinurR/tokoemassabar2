'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/showToast';

const LainLainPage: React.FC = () => {
  const router = useRouter();
  const [pemasukanNominal, setPemasukanNominal] = useState('');
  const [pemasukanDescription, setPemasukanDescription] = useState('');
  const [pengeluaranNominal, setPengeluaranNominal] = useState('');
  const [pengeluaranDescription, setPengeluaranDescription] = useState('');

  const formatNumber = (value: string) => {
    // Remove non-digit characters
    const number = value.replace(/\D/g, '');
    // Format with thousand separator
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePemasukanNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setPemasukanNominal(formatted);
  };

  const handlePengeluaranNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setPengeluaranNominal(formatted);
  };

  const handlePemasukanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type: 'pemasukan',
      nominal: pemasukanNominal.replace(/\./g, ''), // Remove dots before sending
      description: pemasukanDescription,
    };

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setPemasukanNominal('');
        setPemasukanDescription('');
        showToast('success', 'Berhasil menambahkan pemasukan!');
      } else {
        const errorData = await response.json();
        showToast('error', errorData.error || 'Gagal menambahkan pemasukan!');
      }
    } catch {
      showToast('error', 'Gagal menambahkan pemasukan!');
    }
  };

  const handlePengeluaranSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type: 'pengeluaran',
      nominal: pengeluaranNominal.replace(/\./g, ''), // Remove dots before sending
      description: pengeluaranDescription,
    };

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setPengeluaranNominal('');
        setPengeluaranDescription('');
        showToast('success', 'Berhasil menambahkan pengeluaran!');
      } else {
        const errorData = await response.json();
        showToast('error', errorData.error || 'Gagal menambahkan pengeluaran!');
      }
    } catch {
      showToast('error', 'Gagal menambahkan pengeluaran!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transaksi Lain-Lain</h1>
        <button
          onClick={() => router.push('/transaksi/lain-lain/history')}
          className="bg-gray-600 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Riwayat Transaksi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pemasukan Form */}
        <div className="bg-white shadow-sm rounded-lg border p-6">
          <h2 className="text-lg font-medium mb-4">Pemasukan</h2>
          <form onSubmit={handlePemasukanSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Nominal</label>
              <input
                type="text"
                value={pemasukanNominal}
                onChange={handlePemasukanNominalChange}
                className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                placeholder="Contoh: 5.000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Deskripsi</label>
              <input
                type="text"
                value={pemasukanDescription}
                onChange={(e) => setPemasukanDescription(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                placeholder="Masukkan deskripsi"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium h-9 rounded-md transition-colors"
            >
              Submit Pemasukan
            </button>
          </form>
        </div>

        {/* Pengeluaran Form */}
        <div className="bg-white shadow-sm rounded-lg border p-6">
          <h2 className="text-lg font-medium mb-4">Pengeluaran</h2>
          <form onSubmit={handlePengeluaranSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Nominal</label>
              <input
                type="text"
                value={pengeluaranNominal}
                onChange={handlePengeluaranNominalChange}
                className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                placeholder="Contoh: 5.000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Deskripsi</label>
              <input
                type="text"
                value={pengeluaranDescription}
                onChange={(e) => setPengeluaranDescription(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                placeholder="Masukkan deskripsi"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium h-9 rounded-md transition-colors"
            >
              Submit Pengeluaran
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LainLainPage;
