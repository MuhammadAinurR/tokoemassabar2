"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/showToast";

const LainLainPage: React.FC = () => {
  const router = useRouter();
  const [operasionalNominal, setOperasionalNominal] = useState("");
  const [operasionalDescription, setOperasionalDescription] = useState("");

  const formatNumber = (value: string) => {
    // Remove non-digit characters
    const number = value.replace(/\D/g, "");
    // Format with thousand separator
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleOperasionalNominalChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatNumber(e.target.value);
    setOperasionalNominal(formatted);
  };

  const handleOperasionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type: "operasional",
      nominal: operasionalNominal.replace(/\./g, ""), // Remove dots before sending
      description: operasionalDescription,
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setOperasionalNominal("");
        setOperasionalDescription("");
        showToast("success", "Berhasil menambahkan biaya operasional!");
      } else {
        const errorData = await response.json();
        showToast(
          "error",
          errorData.error || "Gagal menambahkan biaya operasional!"
        );
      }
    } catch {
      showToast("error", "Gagal menambahkan biaya operasional!");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Biaya Operasional</h1>
        <button
          onClick={() => router.push("/transaksi/operasional/history")}
          className="bg-gray-600 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Riwayat Biaya Operasional
        </button>
      </div>

      <div className="flex justify-center items-center mt-20">
        {/* Operasional Form */}
        <div className="bg-white shadow-sm rounded-lg border p-6 w-1/2">
          <h2 className="text-lg font-medium mb-4">Tambah Biaya Operasional</h2>
          <form onSubmit={handleOperasionalSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">
                Nominal
              </label>
              <input
                type="text"
                value={operasionalNominal}
                onChange={handleOperasionalNominalChange}
                className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                placeholder="Contoh: 5.000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">
                Deskripsi
              </label>
              <input
                type="text"
                value={operasionalDescription}
                onChange={(e) => setOperasionalDescription(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                placeholder="Masukkan deskripsi"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium h-9 rounded-md transition-colors"
            >
              Submit Biaya Operasional
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LainLainPage;
