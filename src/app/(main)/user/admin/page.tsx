"use client";
import React, { useState } from "react";

const dummyUsers = [
  {
    id: 1,
    username: "admin1",
    nama: "John Doe",
    email: "john.doe@example.com",
    peran: "Super Admin",
    loginTerakhir: "2023-06-10 14:30",
  },
  {
    id: 2,
    username: "admin2",
    nama: "Jane Smith",
    email: "jane.smith@example.com",
    peran: "Admin",
    loginTerakhir: "2023-06-09 09:15",
  },
  {
    id: 3,
    username: "manager1",
    nama: "Bob Johnson",
    email: "bob.johnson@example.com",
    peran: "Manajer",
    loginTerakhir: "2023-06-08 16:45",
  },
  {
    id: 4,
    username: "staff1",
    nama: "Alice Brown",
    email: "alice.brown@example.com",
    peran: "Staf",
    loginTerakhir: "2023-06-07 11:20",
  },
];

const HalamanSemuaUser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = dummyUsers.filter(
    (user) =>
      user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Semua User</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daftar User</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Cari user..."
              className="border rounded-md px-3 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Tambah User Baru
            </button>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Peran
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login Terakhir
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.nama}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.peran}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.loginTerakhir}
                </td>
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

export default HalamanSemuaUser;
