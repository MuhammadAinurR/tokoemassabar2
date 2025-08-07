"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"; // Assuming you have a Table component
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/showToast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode } from "@/context/AppModeContext";
import { getApiEndpoint, getModeDisplayName } from "@/lib/modeUtils";
import type { AppMode } from "@/context/AppModeContext";

interface Item {
  id: number;
  code?: string;
  category: string;
  quantity: number;
  weight: number;
  createdAt: string; // or Date if you want to handle it as a Date object
  name: string;
  notes?: string;
}

const LeburHistoryPage = () => {
  const { mode, isLoading: modeLoading } = useAppMode();
  const [historyData, setHistoryData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!modeLoading && mode) {
      fetchHistoryData();
    }
  }, [currentPage, startDate, endDate, mode, modeLoading]);

  const fetchHistoryData = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && {
          endDate: endDate
            ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString()
            : undefined,
        }),
      });

      // Use mode-aware API endpoint
      const leburHistoryEndpoint = getApiEndpoint("/api/lebur-history", mode);
      const response = await fetch(`${leburHistoryEndpoint}?${params}`);
      const data = await response.json();
      setHistoryData(data.items);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error("Failed to fetch lebur history:", error);
      showToast("error", "Gagal memuat riwayat lebur");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  if (modeLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat mode aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-10">
        <h1 className="text-3xl font-bold">Riwayat Lebur Barang</h1>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            mode === "emas_muda"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {getModeDisplayName(mode)}
        </span>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Tanggal:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Mulai"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => setStartDate(date as Date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span>-</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Akhir"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => setEndDate(date as Date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {(startDate || endDate) && (
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        )}
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <div className="bg-white shadow-md rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell>Kode</TableCell>
                <TableCell>Nama Perhiasan</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Jumlah</TableCell>
                <TableCell>Berat (g)</TableCell>
                <TableCell>Deskripsi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!historyData || historyData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-4 text-gray-500"
                  >
                    Tidak ada data ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                historyData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{item.code ?? "-"}</TableCell>
                    <TableCell>
                      {item.name == "Unknown" ? "Label Hilang" : item.name}
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.weight}g</TableCell>
                    <TableCell>{item.notes ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeburHistoryPage;
