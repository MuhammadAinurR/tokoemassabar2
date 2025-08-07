import React from "react";

const dummyLevelAkses = [
  {
    id: 1,
    nama: "Akses Penuh",
    modul: ["Semua Modul"],
    deskripsi: "Akses lengkap ke semua modul sistem",
  },
  {
    id: 2,
    nama: "Akses Penjualan",
    modul: ["Penjualan", "Inventaris"],
    deskripsi: "Akses ke modul penjualan dan inventaris",
  },
  {
    id: 3,
    nama: "Akses SDM",
    modul: ["Manajemen Karyawan"],
    deskripsi: "Akses ke modul manajemen karyawan",
  },
  {
    id: 4,
    nama: "Akses Laporan",
    modul: ["Laporan"],
    deskripsi: "Akses untuk membuat dan melihat laporan",
  },
];

const HalamanLevelAkses: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Level Akses</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daftar Level Akses</h2>
          <button className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded">
            Tambah Level Akses Baru
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modul
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dummyLevelAkses.map((level) => (
              <tr key={level.id}>
                <td className="px-6 py-4 whitespace-nowrap">{level.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{level.nama}</td>
                <td className="px-6 py-4">{level.modul.join(", ")}</td>
                <td className="px-6 py-4">{level.deskripsi}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                    Ubah
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HalamanLevelAkses;
