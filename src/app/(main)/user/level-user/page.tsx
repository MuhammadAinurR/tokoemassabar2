import React from "react";

const dummyLevelUser = [
  { id: 1, nama: "Super Admin", deskripsi: "Akses penuh ke semua fitur" },
  {
    id: 2,
    nama: "Admin",
    deskripsi: "Akses ke sebagian besar fitur kecuali manajemen pengguna",
  },
  {
    id: 3,
    nama: "Manajer",
    deskripsi: "Akses ke laporan dan manajemen karyawan",
  },
  { id: 4, nama: "Staf", deskripsi: "Akses dasar untuk operasi harian" },
];

const HalamanLevelUser: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Level User</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daftar Level User</h2>
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Tambah Level User Baru
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
                Deskripsi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dummyLevelUser.map((level) => (
              <tr key={level.id}>
                <td className="px-6 py-4 whitespace-nowrap">{level.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{level.nama}</td>
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

export default HalamanLevelUser;
