"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, PrinterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { id } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppMode } from "@/context/AppModeContext";
import { getApiEndpoint, getModeDisplayName } from "@/lib/modeUtils";
import type { AppMode } from "@/context/AppModeContext";

interface Finance {
  id: string;
  date: string;
  openingBalance: number;
  outgoingItems: number;
  incomingMoney: number;
  incomingItems: number;
  outgoingMoney: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  storeClosingBalance: number | null;
}

const formatNumberInput = (value: string): string => {
  // Remove all non-digit characters
  const numbers = value.replace(/\D/g, "");
  // Format with thousand separators
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseFormattedNumber = (value: string): number => {
  // Remove all dots and convert to number
  return parseInt(value.replace(/\./g, ""), 10);
};

export default function FinancePage() {
  const { mode, isLoading: modeLoading } = useAppMode();
  const [finances, setFinances] = React.useState<Finance[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedFinance, setSelectedFinance] = React.useState<Finance | null>(
    null
  );
  const [editValue, setEditValue] = React.useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && {
          endDate: new Date(endDate.setHours(23, 59, 59, 999)).toISOString(),
        }),
      });

      // Use mode-aware API endpoint
      const financeEndpoint = getApiEndpoint("/api/finance", mode);
      const response = await fetch(`${financeEndpoint}?${params}`);
      const { data, pagination } = await response.json();

      setFinances([...data].reverse());
      setTotalPages(pagination.pages);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!modeLoading && mode) {
      fetchData();
    }
  }, [currentPage, startDate, endDate, mode, modeLoading]);

  const renderPagination = () => (
    <div className="mt-4 flex items-center justify-between">
      <Button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <Button
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );

  const handlePrint = async () => {
    if (!startDate || !endDate) return;

    try {
      // Fetch all data within date range without pagination
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: new Date(endDate.setHours(23, 59, 59, 999)).toISOString(),
        all: "true", // New parameter to fetch all data
      });

      // Use mode-aware API endpoint for printing
      const financeEndpoint = getApiEndpoint("/api/finance", mode);
      const response = await fetch(`${financeEndpoint}?${params}`);
      const { data } = await response.json();

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const tableRows =
        data.length === 0
          ? `
        <tr>
          <td colspan="11" style="text-align: center; padding: 1rem; font-weight: 500;">
            Tidak ada data keuangan
          </td>
        </tr>
      `
          : data
              .map(
                (finance: Finance) => `
        <tr>
          <td>${format(new Date(finance.date), "dd/MM/yyyy")}</td>
          <td style="text-align: right">${formatIDR(
            finance.openingBalance
          )}</td>
          <td style="text-align: right">${finance.outgoingItems}g</td>
          <td style="text-align: right">${formatIDR(finance.incomingMoney)}</td>
          <td style="text-align: right">${finance.incomingItems}g</td>
          <td style="text-align: right">${formatIDR(finance.outgoingMoney)}</td>
          <td style="text-align: right">${formatIDR(finance.totalIncome)}</td>
          <td style="text-align: right">${formatIDR(finance.totalExpense)}</td>
          <td style="text-align: right; font-weight: bold">${formatIDR(
            finance.closingBalance
          )}</td>
          <td style="text-align: right">${
            finance.storeClosingBalance
              ? formatIDR(finance.storeClosingBalance)
              : "-"
          }</td>
          <td style="text-align: right">${
            finance.storeClosingBalance
              ? formatIDR(finance.closingBalance - finance.storeClosingBalance)
              : "-"
          }</td>
        </tr>
      `
              )
              .join("");

      const tableHTML = `
        <html>
          <head>
            <title>Laporan Keuangan</title>
            <style>
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin-bottom: 1rem;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: right; 
              }
              th { 
                background-color: #f8f9fa;
                text-align: center;
              }
              td[colspan="11"] {
                text-align: center;
              }
              h1 {
                text-align: center;
                margin-bottom: 1rem;
              }
              @media print {
                @page { size: landscape; }
              }
            </style>
          </head>
          <body>
            <h1>Laporan Keuangan</h1>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Saldo Awal</th>
                  <th>Barang Keluar</th>
                  <th>Uang Masuk</th>
                  <th>Barang Masuk</th>
                  <th>Uang Keluar</th>
                  <th>Pemasukan</th>
                  <th>Pengeluaran</th>
                  <th>Saldo Akhir</th>
                  <th>Saldo Toko</th>
                  <th>Selisih</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      printWindow.document.write(tableHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Failed to fetch print data:", error);
    }
  };

  const handleStoreBalanceClick = (finance: Finance) => {
    setSelectedFinance(finance);
    setEditValue(
      finance.storeClosingBalance
        ? formatNumberInput(finance.storeClosingBalance.toString())
        : ""
    );
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedFinance) return;

    try {
      // Use mode-aware API endpoint for updating
      const financeEndpoint = getApiEndpoint("/api/finance", mode);
      const response = await fetch(financeEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedFinance.id,
          storeClosingBalance: parseFormattedNumber(editValue) || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      await fetchData();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update store closing balance:", error);
    }
  };

  if (modeLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <CalendarIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat mode aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Laporan Keuangan</h1>
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
        <Button
          onClick={handlePrint}
          className="flex items-center gap-2"
          disabled={!startDate || !endDate}
        >
          <PrinterIcon className="h-4 w-4" />
          Print
        </Button>
      </div>
      <div className="mb-4 flex gap-4 items-center justify-end">
        <div className="flex gap-2 items-center">
          <span>Dari:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "EEEE, dd MMMM yyyy", { locale: id })
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date: Date | undefined) =>
                  setStartDate(date || null)
                }
                initialFocus
                locale={id}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2 items-center">
          <span>Sampai:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, "EEEE, dd MMMM yyyy", { locale: id })
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date: Date | undefined) => setEndDate(date || null)}
                initialFocus
                locale={id}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-md shadow-sm bg-white">
        <table className="min-w-full border-collapse border border-gray-300 text-xs rounded-md overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Tanggal</th>
              <th className="border border-gray-300 p-2">Saldo Awal</th>
              <th className="border border-gray-300 p-2">Barang Keluar</th>
              <th className="border border-gray-300 p-2">Uang Masuk</th>
              <th className="border border-gray-300 p-2">Barang Masuk</th>
              <th className="border border-gray-300 p-2">Uang Keluar</th>
              <th className="border border-gray-300 p-2">Pemasukan</th>
              <th className="border border-gray-300 p-2">Pengeluaran</th>
              <th className="border border-gray-300 p-2">Saldo Akhir</th>
              <th className="border border-gray-300 p-2">Saldo Toko</th>
              <th className="border border-gray-300 p-2">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={11}
                  className="border border-gray-300 p-4 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : finances.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="border border-gray-300 p-4 text-center font-medium"
                >
                  Tidak ada data keuangan
                </td>
              </tr>
            ) : (
              finances.map((finance) => (
                <tr key={finance.id}>
                  <td className="border border-gray-300 p-2">
                    {format(new Date(finance.date), "dd/MM/yyyy")}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatIDR(finance.openingBalance)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {finance.outgoingItems}g
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatIDR(finance.incomingMoney)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {finance.incomingItems}g
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatIDR(finance.outgoingMoney)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatIDR(finance.totalIncome)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatIDR(finance.totalExpense)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-bold">
                    {formatIDR(finance.closingBalance)}
                  </td>
                  <td
                    className="border border-gray-300 p-2 text-right cursor-pointer hover:bg-gray-50"
                    onClick={() => handleStoreBalanceClick(finance)}
                  >
                    {finance.storeClosingBalance
                      ? formatIDR(finance.storeClosingBalance)
                      : "-"}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {finance.storeClosingBalance
                      ? formatIDR(
                          finance.storeClosingBalance - finance.closingBalance
                        )
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && renderPagination()}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Saldo Toko</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Tanggal:{" "}
                {selectedFinance &&
                  format(new Date(selectedFinance.date), "dd/MM/yyyy")}
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">Nilai:</label>
              <Input
                type="text"
                value={editValue}
                onChange={(e) => {
                  const formatted = formatNumberInput(e.target.value);
                  setEditValue(formatted);
                }}
                placeholder="Masukkan saldo toko"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleSaveEdit}>Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};
