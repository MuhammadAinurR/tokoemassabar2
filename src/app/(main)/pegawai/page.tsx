import React from "react";

const dummyEmployees = [
  {
    id: 1,
    name: "Budi Santoso",
    position: "Kasir",
    joinDate: "2022-01-15",
    phoneNumber: "081234567890",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Siti Rahayu",
    position: "Sales",
    joinDate: "2021-08-22",
    phoneNumber: "087654321098",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Agus Setiawan",
    position: "Manager",
    joinDate: "2020-03-10",
    phoneNumber: "089876543210",
    status: "Aktif",
  },
  {
    id: 4,
    name: "Dewi Lestari",
    position: "Admin",
    joinDate: "2022-11-05",
    phoneNumber: "082345678901",
    status: "Cuti",
  },
];

const DataPegawaiPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Data Pegawai</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daftar Pegawai</h2>
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Tambah Pegawai Baru
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posisi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Bergabung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nomor Telepon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dummyEmployees.map((employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap">{employee.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{employee.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.position}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.joinDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.phoneNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status === "Aktif"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {employee.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                    Edit
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

export default DataPegawaiPage;
