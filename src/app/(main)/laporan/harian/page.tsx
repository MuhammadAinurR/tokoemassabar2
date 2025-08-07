"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PrinterIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppMode } from "@/context/AppModeContext";
import { getApiEndpoint, getModeDisplayName } from "@/lib/modeUtils";
import type { AppMode } from "@/context/AppModeContext";

const LaporanHarianPage: React.FC = () => {
  const { mode, isLoading: modeLoading } = useAppMode();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5000000;

  // Set default dates to today at 00:00:00
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(
    new Date(today.setHours(0, 0, 0, 0))
  ); // Set to midnight
  const [endDate, setEndDate] = useState<Date>(
    new Date(today.getTime() + 24 * 60 * 60 * 1000)
  ); // End date is tomorrow

  // Move loadPageData function outside of useEffect so it can be called directly
  const loadPageData = async () => {
    if (modeLoading || !mode) return; // Don't load data if mode is not ready

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const salesEndpoint = getApiEndpoint("/api/sales", mode);
      const [itemsResponse] = await Promise.all([
        fetch(`${salesEndpoint}?limit=${itemsPerPage}&${params.toString()}`),
      ]);

      const [itemsData] = await Promise.all([itemsResponse.json()]);

      setItems(itemsData.data);
      setTotalPages(itemsData.totalPages);
    } catch (error) {
      console.error("Error loading page data:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to refetch data when startDate or endDate changes
  useEffect(() => {
    loadPageData();
  }, [startDate, endDate, mode, modeLoading]); // Call loadPageData when startDate or endDate changes

  const resetFilters = () => {
    setStartDate(new Date(today.setHours(0, 0, 0, 0)));
    setEndDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Laporan Harian Penjualan</h1>
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
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date: any) => {
                  setStartDate(date);
                  setEndDate(
                    new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)
                  ); // Ensure endDate is the end of the selected day
                  loadPageData(); // Fetch data after selecting the date
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2"
            >
              Reset
            </Button>
          )}
          <Button
            onClick={() => printSalesItems(startDate, endDate, mode)}
            className="flex items-center gap-2"
            disabled={!startDate || !endDate}
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <DailyReport startDate={startDate} endDate={endDate} salesData={items} />
    </div>
  );
};

const printSalesItems = async (
  startDate: Date | undefined,
  endDate: Date | undefined,
  mode: AppMode
) => {
  if (!startDate || !endDate) return;

  try {
    const params = new URLSearchParams();
    params.append("startDate", startDate.toISOString());
    params.append(
      "endDate",
      new Date(endDate.setHours(23, 59, 59, 999)).toISOString()
    );
    params.append("limit", "5000"); // Set a high limit to fetch all data
    params.append("page", "1");
    params.append("status", "pending");

    const salesEndpoint = getApiEndpoint("/api/sales", mode);
    const response = await fetch(`${salesEndpoint}?${params.toString()}`);
    const { data } = await response.json();
    // Calculate summary data
    const summary = data.reduce((acc: any, item: any) => {
      console.log(item);
      const categoryName = item.category.name;
      // Get weight from either incomingItem.weight or grocery.weight
      const weight = parseFloat(item.grocery.weight);

      if (!acc[categoryName]) {
        acc[categoryName] = {
          count: 0,
          totalWeight: 0,
        };
      }

      acc[categoryName].count += 1;
      acc[categoryName].totalWeight += weight;

      return acc;
    }, {});

    // Calculate totals
    const totals = Object.values(summary).reduce(
      (acc: { totalCount: number; totalWeight: number }, curr: any) => {
        acc.totalCount += curr.count;
        acc.totalWeight += curr.totalWeight;
        return acc;
      },
      { totalCount: 0, totalWeight: 0 }
    );

    // Create summary table rows
    const summaryRows =
      Object.entries(summary)
        .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB)) // Sort categories alphabetically
        .map(
          ([category, { count, totalWeight }]: [string, any]) => `
        <tr>
          <td>${category}</td>
          <td>${count}</td>
          <td>${totalWeight.toFixed(3)}g</td>
          
        </tr>
      `
        )
        .join("") +
      `
      <tr style="font-weight: bold; border-top: 2px solid #000;">
        <td>Total</td>
        <td>${totals.totalCount}</td>
        <td>${totals.totalWeight.toFixed(3)}g</td>

      </tr>
    `;

    // Sort data by category name
    const sortedData = [...data].sort((a: any, b: any) =>
      a.grocery.name.localeCompare(b.grocery.name)
    );

    const tableRows =
      sortedData.length === 0
        ? `<tr><td colspan="6" style="text-align: center; padding: 0.5rem; font-weight: 500;">Tidak ada data penjualan</td></tr>`
        : sortedData
            .map(
              (item: any) => `
        <tr>
          <td>${item.code || "-"}</td>
          <td>${item.grocery.name}</td>
          <td>${item.grocery.weight}g</td>
          <td>${item.category.name}</td>
          <td>Rp ${parseInt(item.sellPrice).toLocaleString()}</td>
        </tr>
      `
            )
            .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHTML = `
      <html>
        <head>
          <title>Laporan Harian</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              font-size: 11px;
              margin: 0;
              padding: 15px;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-bottom: 10rem;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 4px 6px; 
              text-align: left; 
              font-size: 10px;
            }
            th { 
              background-color: #f8f9fa;
              font-weight: bold;
            }
            h1, h2 {
              text-align: center;
              margin-bottom: 0.5rem;
              font-size: 14px;
            }
            .date-range {
              text-align: center;
              margin-bottom: 0.5rem;
              font-size: 11px;
            }
            .summary-table {
              width: 50%;
              margin: 1rem auto;
            }
            @media print {
              @page { 
                size: portrait;
                margin: 0.5cm;
                margin-bottom: 1cm;
              }
              /* Hide browser's default header and footer */
              html {
                -webkit-print-color-adjust: exact;
              }
              body {
                -webkit-print-color-adjust: exact;
              }
              /* Remove URLs */
              @page {
                margin: 0.5cm;
                size: portrait;
              }
              /* Hide URL and page numbers */
              @page :first {
                margin-bottom: 0;
              }
              @page :left {
                margin-bottom: 0;
              }
              @page :right {
                margin-bottom: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>Laporan Penjualan</h1>
          <div class="date-range">
            Periode: ${startDate.toLocaleDateString("id-ID")}
          </div>
          
          <table class="summary-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Jumlah Barang</th>
                <th>Jumlah Berat</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>

          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Berat</th>
                <th>Kategori</th>
                <th>Harga</th>
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

    // Wait for resources to load before printing
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing (optional)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  } catch (error) {
    console.error("Failed to fetch print data:", error);
  }
};
// Components
const DailyReport = ({
  startDate,
  endDate,
  salesData,
}: {
  startDate?: Date;
  endDate?: Date;
  salesData: any[];
}) => {
  // Calculate summary data
  const summary = salesData.reduce((acc: any, item: any) => {
    const categoryName = item.category.name;
    const weight = parseFloat(item.grocery.weight);
    const sellPrice = parseFloat(item.sellPrice);

    if (!acc[categoryName]) {
      acc[categoryName] = {
        count: 0,
        totalWeight: 0,
        totalSales: 0,
      };
    }

    acc[categoryName].count += 1;
    acc[categoryName].totalWeight += weight;
    acc[categoryName].totalSales += sellPrice;

    return acc;
  }, {});

  // Calculate totals
  const totals = Object.values(summary).reduce(
    (
      acc: { totalCount: number; totalWeight: number; totalSales: number },
      curr: any
    ) => {
      acc.totalCount += curr.count;
      acc.totalWeight += curr.totalWeight;
      acc.totalSales += curr.totalSales;
      return acc;
    },
    { totalCount: 0, totalWeight: 0, totalSales: 0 }
  );

  // Calculate total sales amount
  const totalSalesAmount = salesData.reduce((total, item) => {
    return total + parseFloat(item.sellPrice) || 0;
  }, 0);

  // Create summary table rows
  const summaryRows =
    Object.entries(summary)
      .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
      .map(
        ([category, { count, totalWeight, totalSales }]: [string, any]) => `
      <tr>
        <td>${category}</td>
        <td>${count}</td>
        <td>${totalWeight.toFixed(3)}g</td>
        <td>Rp ${totalSales.toLocaleString()}</td>
      </tr>
    `
      )
      .join("") +
    `
    <tr style="font-weight: bold; border-top: 2px solid #000;">
      <td>Total</td>
      <td>${totals.totalCount}</td>
      <td>${totals.totalWeight.toFixed(3)}g</td>
      <td>Rp ${totals.totalSales.toLocaleString()}</td>
    </tr>
  `;

  return (
    <div className="bg-white shadow-md rounded-lg">
      <div className="px-4 py-3 border-t text-center">
        <h2 className="text-lg font-bold">Laporan Harian</h2>
        {startDate && endDate && (
          <div className="text-sm text-gray-600 mb-4">
            Periode: {startDate.toLocaleDateString("id-ID")}
          </div>
        )}
        <table className="summary-table mx-auto border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Kategori</th>
              <th className="border border-gray-300 px-4 py-2">
                Jumlah Barang
              </th>
              <th className="border border-gray-300 px-4 py-2">Jumlah Berat</th>
              <th className="border border-gray-300 px-4 py-2">Jumlah Uang</th>
            </tr>
          </thead>
          <tbody dangerouslySetInnerHTML={{ __html: summaryRows }} />
        </table>

        <div className="mt-4">
          <table className="mx-auto border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Kode</th>
                <th className="border border-gray-300 px-4 py-2">Nama</th>
                <th className="border border-gray-300 px-4 py-2">Berat</th>
                <th className="border border-gray-300 px-4 py-2">Kategori</th>
                <th className="border border-gray-300 px-4 py-2">Harga</th>
              </tr>
            </thead>
            <tbody>
              {salesData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-2">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                salesData
                  .sort((a, b) => {
                    const categoryComparison = a.category.name.localeCompare(
                      b.category.name
                    );
                    if (categoryComparison !== 0) return categoryComparison; // Sort by category.name
                    return a.grocery.name.localeCompare(b.grocery.name); // Sort by grocery.name within the same category
                  })
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.grocery.code || "-"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.grocery.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.grocery.weight} g
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.category.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {parseInt(item.sellPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LaporanHarianPage;
