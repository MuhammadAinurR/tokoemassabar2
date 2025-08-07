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
import { CalendarIcon, Loader2, PrinterIcon } from "lucide-react"; // You might need to install lucide-react
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormItem } from "@/components/ui/form";
import { showToast } from "@/lib/showToast";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useAppMode } from "@/context/AppModeContext";
import { getApiEndpoint, getModeDisplayName } from "@/lib/modeUtils";
import type { AppMode } from "@/context/AppModeContext";

interface DailySummary {
  id: string;
  date: string;
  // Ring
  incomingRingWeight: number;
  incomingRingQty: number;
  outgoingRingWeight: number;
  outgoingRingQty: number;
  nonSaleRingWeight: number;
  nonSaleRingQty: number;
  totalRingWeight: number;
  totalRingQty: number;
  // Earring
  incomingEarringWeight: number;
  incomingEarringQty: number;
  outgoingEarringWeight: number;
  outgoingEarringQty: number;
  nonSaleEarringWeight: number;
  nonSaleEarringQty: number;
  totalEarringWeight: number;
  totalEarringQty: number;
  // ... other fields follow the same pattern
  // Daily totals
  incomingTotalWeight: number;
  incomingTotalQty: number;
  outgoingTotalWeight: number;
  outgoingTotalQty: number;
  nonSaleTotalWeight: number;
  nonSaleTotalQty: number;
  grandTotalWeight: number;
  grandTotalQty: number;
  // Necklace
  incomingNecklaceWeight: number;
  incomingNecklaceQty: number;
  outgoingNecklaceWeight: number;
  outgoingNecklaceQty: number;
  nonSaleNecklaceWeight: number;
  nonSaleNecklaceQty: number;
  totalNecklaceWeight: number;
  totalNecklaceQty: number;
  // Bracelet
  incomingBraceletWeight: number;
  incomingBraceletQty: number;
  outgoingBraceletWeight: number;
  outgoingBraceletQty: number;
  nonSaleBraceletWeight: number;
  nonSaleBraceletQty: number;
  totalBraceletWeight: number;
  totalBraceletQty: number;
  // Pendant
  incomingPendantWeight: number;
  incomingPendantQty: number;
  outgoingPendantWeight: number;
  outgoingPendantQty: number;
  nonSalePendantWeight: number;
  nonSalePendantQty: number;
  totalPendantWeight: number;
  totalPendantQty: number;
  // Stud Earring
  incomingStudEarringWeight: number;
  incomingStudEarringQty: number;
  outgoingStudEarringWeight: number;
  outgoingStudEarringQty: number;
  nonSaleStudEarringWeight: number;
  nonSaleStudEarringQty: number;
  totalStudEarringWeight: number;
  totalStudEarringQty: number;
}

interface Category {
  id: string;
  code: string;
  name: string;
  itemCount: number;
  totalWeight: number;
  goldContent: string;
}

interface CategoryGroup {
  name: string;
  karats: {
    id: string;
    code: string;
    name: string;
    goldContent: string;
  }[];
}

interface MeltedItem {
  id: string;
  date: string;
  code: string | null;
  weight: number;
  quantity: number;
  category: {
    name: string;
    goldContent: string;
  };
}

// Define the interface for confirmation data
interface ConfirmationData {
  name: string;
  code: string;
  tkr: string;
  weight: number;
}

// Define the type for actionData
interface LeburActionData {
  category: string;
  quantity: number;
  weight: number;
  code?: string; // Optional field
  notes?: string;
}

const formatWeight = (weight: number): string => {
  // Convert the number to a string with German locale formatting
  const formattedNumber = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(weight);

  return formattedNumber + "g";
};

export default function LaporanStockBarangPage() {
  const { mode, isLoading: modeLoading } = useAppMode();
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [hasCode, setHasCode] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantity, setQuantity] = useState<string>("");
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [meltedItems, setMeltedItems] = useState<MeltedItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationData | null>(null);
  const router = useRouter(); // Initialize useRouter
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!modeLoading && mode) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, startDate, endDate, mode, modeLoading]);

  useEffect(() => {
    if (!modeLoading && mode) {
      fetchCategories();
    }
  }, [mode, modeLoading]);

  useEffect(() => {
    if (isHistoryDialogOpen && !modeLoading && mode) {
      fetchMeltedItems();
    }
  }, [isHistoryDialogOpen, historyPage, mode, modeLoading]);

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

      const dailySummaryEndpoint = getApiEndpoint("/api/daily-summary", mode);
      const response = await fetch(`${dailySummaryEndpoint}?${params}`);
      const { data, pagination } = await response.json();
      setSummaries([...data].reverse());
      setTotalPages(pagination.pages);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesEndpoint = getApiEndpoint("/api/categories", mode);
      const response = await fetch(categoriesEndpoint);
      const data = await response.json();
      setCategories(data);

      // Group categories
      const groups = data.reduce((acc: CategoryGroup[], curr: Category) => {
        const baseName = curr.name.split(" ")[0];
        const group = acc.find((g) => g.name === baseName);

        if (group) {
          group.karats.push({
            id: curr.id,
            code: curr.code,
            name: curr.name,
            goldContent: curr.goldContent,
          });
        } else {
          acc.push({
            name: baseName,
            karats: [
              {
                id: curr.id,
                code: curr.code,
                name: curr.name,
                goldContent: curr.goldContent,
              },
            ],
          });
        }

        return acc;
      }, []);

      setCategoryGroups(groups);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchMeltedItems = async () => {
    try {
      setHistoryLoading(true);
      const meltedItemsEndpoint = getApiEndpoint("/api/melted-items", mode);
      const response = await fetch(
        `${meltedItemsEndpoint}?page=${historyPage}`
      );
      const { data, pagination } = await response.json();
      setMeltedItems(data);
      setHistoryTotalPages(pagination.pages);
    } catch (error) {
      console.error("Failed to fetch melted items:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

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

  const renderHistoryPagination = () => (
    <div className="mt-4 flex items-center justify-between">
      <Button
        onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
        disabled={historyPage === 1}
      >
        Previous
      </Button>
      <span>
        Page {historyPage} of {historyTotalPages}
      </span>
      <Button
        onClick={() =>
          setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages))
        }
        disabled={historyPage === historyTotalPages}
      >
        Next
      </Button>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (hasCode) {
      // Fetch the grocery information first
      try {
        const groceriesEndpoint = getApiEndpoint("/api/groceries", mode);
        const response = await fetch(`${groceriesEndpoint}/${code}`);
        const groceryData = await response.json();

        if (!response.ok) {
          throw new Error(groceryData.error || "Failed to fetch grocery data");
        }

        // Check if the grocery is available
        if (groceryData.isSold) {
          showToast("error", "Barang tidak tersedia");
          return; // Exit if the item is not available
        }

        // Set weight and quantity from grocery data
        setWeight(groceryData.weight);
        setQuantity("1");
        setSelectedCategoryId(groceryData.category.id);

        // Set confirmation data and open dialog
        setConfirmationData(groceryData);
        setConfirmationDialogOpen(true);
      } catch (error) {
        console.error("Error fetching grocery data:", error);
        showToast(
          "error",
          error instanceof Error
            ? error.message
            : "Gagal memproses lebur barang"
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Proceed directly to the API call if no code
      await processLebur();
    }
  };

  // New function to handle the actual API call
  const processLebur = async () => {
    try {
      // Step 1: Process the lebur action
      const leburEndpoint = getApiEndpoint("/api/daily-summary/lebur", mode);
      const response = await fetch(leburEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          weight: parseFloat(weight),
          quantity: parseInt(quantity),
          code: hasCode ? code : undefined,
          notes: notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Barang tidak berhasil dilebur");
      }

      // Step 2: Log the lebur action
      await logLeburAction({
        category: selectedCategoryId,
        quantity: parseInt(quantity),
        weight: parseFloat(weight),
        code: hasCode ? code : undefined,
        notes: notes,
      });

      showToast("success", "Barang berhasil dilebur");
      setIsFormDialogOpen(false);
      // Reset form
      setSelectedType("");
      setSelectedCategoryId("");
      setWeight("");
      setQuantity("");
      setCode("");
      setNotes("");
      setHasCode(null);
      // Close confirmation dialog
      setConfirmationDialogOpen(false);
      // Refresh the data
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Gagal memproses lebur barang"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // New function to log the lebur action
  const logLeburAction = async (actionData: LeburActionData) => {
    try {
      const leburHistoryEndpoint = getApiEndpoint("/api/lebur-history", mode);
      await fetch(leburHistoryEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(actionData),
      });
    } catch (error) {
      console.error("Failed to log lebur action:", error);
    }
  };

  const handlePrint = async () => {
    if (!startDate || !endDate) return;

    try {
      // Fetch all data within date range without pagination
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: new Date(endDate.setHours(23, 59, 59, 999)).toISOString(),
        all: "true", // New parameter to fetch all data
      });

      const dailySummaryEndpoint = getApiEndpoint("/api/daily-summary", mode);
      const response = await fetch(`${dailySummaryEndpoint}?${params}`);
      const { data } = await response.json();

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const tableRows =
        data.length === 0
          ? `
        <tr>
          <td colspan="29" style="text-align: center; padding: 1rem; font-weight: 500;">
            Tidak ada data tersedia
          </td>
        </tr>
      `
          : data
              .map(
                (summary: DailySummary) => `
        <tr>
          <td rowspan="2">${format(new Date(summary.date), "dd/MM/yyyy")}</td>
          <td>${formatWeight(summary.incomingRingWeight)}</td>
          <td>${formatWeight(summary.outgoingRingWeight)}</td>
          <td>${formatWeight(summary.nonSaleRingWeight)}</td>
          <td class="font-bold">${formatWeight(summary.totalRingWeight)}</td>
          <td>${formatWeight(summary.incomingEarringWeight)}</td>
          <td>${formatWeight(summary.outgoingEarringWeight)}</td>
          <td>${formatWeight(summary.nonSaleEarringWeight)}</td>
          <td class="font-bold">${formatWeight(summary.totalEarringWeight)}</td>
          <td>${formatWeight(summary.incomingNecklaceWeight)}</td>
          <td>${formatWeight(summary.outgoingNecklaceWeight)}</td>
          <td>${formatWeight(summary.nonSaleNecklaceWeight)}</td>
          <td class="font-bold">${formatWeight(
            summary.totalNecklaceWeight
          )}</td>
          <td>${formatWeight(summary.incomingBraceletWeight)}</td>
          <td>${formatWeight(summary.outgoingBraceletWeight)}</td>
          <td>${formatWeight(summary.nonSaleBraceletWeight)}</td>
          <td class="font-bold">${formatWeight(
            summary.totalBraceletWeight
          )}</td>
          <td>${formatWeight(summary.incomingPendantWeight)}</td>
          <td>${formatWeight(summary.outgoingPendantWeight)}</td>
          <td>${formatWeight(summary.nonSalePendantWeight)}</td>
          <td class="font-bold">${formatWeight(summary.totalPendantWeight)}</td>
          <td>${formatWeight(summary.incomingStudEarringWeight)}</td>
          <td>${formatWeight(summary.outgoingStudEarringWeight)}</td>
          <td>${formatWeight(summary.nonSaleStudEarringWeight)}</td>
          <td class="font-bold">${formatWeight(
            summary.totalStudEarringWeight
          )}</td>
          <td>${formatWeight(summary.incomingTotalWeight)}</td>
          <td>${formatWeight(summary.outgoingTotalWeight)}</td>
          <td>${formatWeight(summary.nonSaleTotalWeight)}</td>
          <td class="font-bold">${formatWeight(summary.grandTotalWeight)}</td>
        </tr>
        <tr class="bg-gray-50">
          <td>${summary.incomingRingQty}</td>
          <td>${summary.outgoingRingQty}</td>
          <td>${summary.nonSaleRingQty}</td>
          <td class="font-bold">${summary.totalRingQty}</td>
          <td>${summary.incomingEarringQty}</td>
          <td>${summary.outgoingEarringQty}</td>
          <td>${summary.nonSaleEarringQty}</td>
          <td class="font-bold">${summary.totalEarringQty}</td>
          <td>${summary.incomingNecklaceQty}</td>
          <td>${summary.outgoingNecklaceQty}</td>
          <td>${summary.nonSaleNecklaceQty}</td>
          <td class="font-bold">${summary.totalNecklaceQty}</td>
          <td>${summary.incomingBraceletQty}</td>
          <td>${summary.outgoingBraceletQty}</td>
          <td>${summary.nonSaleBraceletQty}</td>
          <td class="font-bold">${summary.totalBraceletQty}</td>
          <td>${summary.incomingPendantQty}</td>
          <td>${summary.outgoingPendantQty}</td>
          <td>${summary.nonSalePendantQty}</td>
          <td class="font-bold">${summary.totalPendantQty}</td>
          <td>${summary.incomingStudEarringQty}</td>
          <td>${summary.outgoingStudEarringQty}</td>
          <td>${summary.nonSaleStudEarringQty}</td>
          <td class="font-bold">${summary.totalStudEarringQty}</td>
          <td>${summary.incomingTotalQty}</td>
          <td>${summary.outgoingTotalQty}</td>
          <td>${summary.nonSaleTotalQty}</td>
          <td class="font-bold">${summary.grandTotalQty}</td>
        </tr>
      `
              )
              .join("");

      const tableHTML = `
        <html>
          <head>
            <title>Laporan Stock Barang</title>
            <style>
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin-bottom: 1rem;
                font-size: 10px;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 4px; 
                text-align: right; 
              }
              th { 
                background-color: #f8f9fa;
                text-align: center;
              }
              td[rowspan="2"] {
                text-align: center;
              }
              .font-bold {
                font-weight: bold;
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
            <h1>Laporan Stock Barang</h1>
            <table>
              <thead>
                <tr>
                  <th rowspan="2">Tanggal</th>
                  <th colspan="4">Cincin</th>
                  <th colspan="4">Anting</th>
                  <th colspan="4">Kalung</th>
                  <th colspan="4">Gelang</th>
                  <th colspan="4">Liontin</th>
                  <th colspan="4">Giwang</th>
                  <th colspan="4">Total</th>
                </tr>
                <tr>
                  <th>+</th>
                  <th>-</th>
                  <th>lb</th>
                  <th>=</th>
                  <th>+</th>
                  <th>-</th>
                  <th>lb</th>
                  <th>=</th>
                  <th>+</th>
                  <th>-</th>
                  <th>lb</th>
                  <th>=</th>
                  <th>+</th>
                  <th>-</th>
                  <th>lb</th>
                  <th>=</th>
                  <th>+</th>
                  <th>-</th>
                  <th>lb</th>
                  <th>=</th>
                  <th>+</th>
                  <th>-</th>
                  <th>lb</th>
                  <th>=</th>
                  <th>+</th>
                  <th>-</th>
                  <th>lb</th>
                  <th>=</th>
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Laporan Stock Barang</h1>
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
          <Button
            onClick={() => setIsFormDialogOpen(true)}
            className="flex items-center gap-2"
          >
            Lebur
          </Button>
          <Button
            onClick={() => router.push("/laporan/stock-barang/lebur-history")}
            className="flex items-center gap-2"
          >
            Riwayat Lebur
          </Button>
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2"
            disabled={!startDate || !endDate}
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
      <div className="mb-4 flex gap-4 items-center justify-end">
        <div className="flex gap-2 items-center">
          <span>From:</span>
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
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2 items-center">
          <span>To:</span>
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
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-md shadow-sm bg-white">
        <table className="min-w-full border-collapse border border-gray-300 text-xs rounded-md overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1.5" rowSpan={2}>
                Tanggal
              </th>
              <th className="border border-gray-300 p-1.5" colSpan={4}>
                Cincin
              </th>
              <th className="border border-gray-300 p-1.5" colSpan={4}>
                Anting
              </th>
              <th className="border border-gray-300 p-1.5" colSpan={4}>
                Kalung
              </th>
              <th className="border border-gray-300 p-1.5" colSpan={4}>
                Gelang
              </th>
              <th className="border border-gray-300 p-1.5" colSpan={4}>
                Liontin
              </th>
              <th className="border border-gray-300 p-1.5" colSpan={4}>
                Giwang
              </th>
              <th className="border border-gray-300 p-1.5" colSpan={4}>
                Total
              </th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-1.5">+</th>
              <th className="border border-gray-300 p-1.5">-</th>
              <th className="border border-gray-300 p-1.5">lb</th>
              <th className="border border-gray-300 p-1.5">=</th>
              {/* Earring columns */}
              <th className="border border-gray-300 p-1.5">+</th>
              <th className="border border-gray-300 p-1.5">-</th>
              <th className="border border-gray-300 p-1.5">lb</th>
              <th className="border border-gray-300 p-1.5">=</th>
              {/* Necklace columns */}
              <th className="border border-gray-300 p-1.5">+</th>
              <th className="border border-gray-300 p-1.5">-</th>
              <th className="border border-gray-300 p-1.5">lb</th>
              <th className="border border-gray-300 p-1.5">=</th>
              {/* Bracelet columns */}
              <th className="border border-gray-300 p-1.5">+</th>
              <th className="border border-gray-300 p-1.5">-</th>
              <th className="border border-gray-300 p-1.5">lb</th>
              <th className="border border-gray-300 p-1.5">=</th>
              {/* Pendant columns */}
              <th className="border border-gray-300 p-1.5">+</th>
              <th className="border border-gray-300 p-1.5">-</th>
              <th className="border border-gray-300 p-1.5">lb</th>
              <th className="border border-gray-300 p-1.5">=</th>
              {/* Stud Earring columns */}
              <th className="border border-gray-300 p-1.5">+</th>
              <th className="border border-gray-300 p-1.5">-</th>
              <th className="border border-gray-300 p-1.5">lb</th>
              <th className="border border-gray-300 p-1.5">=</th>
              {/* Total columns */}
              <th className="border border-gray-300 p-1.5">+</th>
              <th className="border border-gray-300 p-1.5">-</th>
              <th className="border border-gray-300 p-1.5">lb</th>
              <th className="border border-gray-300 p-1.5">=</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={28}
                  className="border border-gray-300 p-4 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : summaries?.length === 0 ? (
              <tr>
                <td
                  colSpan={28}
                  className="border border-gray-300 p-4 text-center"
                >
                  Tidak ada data tersedia
                </td>
              </tr>
            ) : (
              summaries?.map((summary) => (
                <React.Fragment key={`${summary.date}-fragment`}>
                  {/* Weight row */}
                  <tr key={`${summary.date}-weight`}>
                    <td
                      className="border border-gray-300 p-1.5 whitespace-nowrap"
                      rowSpan={2}
                    >
                      {format(new Date(summary.date), "dd/MM/yyyy")}
                    </td>
                    {/* Ring weights */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.incomingRingWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.outgoingRingWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.nonSaleRingWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {formatWeight(summary.totalRingWeight)}
                    </td>
                    {/* Earring weights */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.incomingEarringWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.outgoingEarringWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.nonSaleEarringWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {formatWeight(summary.totalEarringWeight)}
                    </td>
                    {/* Necklace weights */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.incomingNecklaceWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.outgoingNecklaceWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.nonSaleNecklaceWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {formatWeight(summary.totalNecklaceWeight)}
                    </td>
                    {/* Bracelet weights */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.incomingBraceletWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.outgoingBraceletWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.nonSaleBraceletWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {formatWeight(summary.totalBraceletWeight)}
                    </td>
                    {/* Pendant weights */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.incomingPendantWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.outgoingPendantWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.nonSalePendantWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {formatWeight(summary.totalPendantWeight)}
                    </td>
                    {/* Stud Earring weights */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.incomingStudEarringWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.outgoingStudEarringWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.nonSaleStudEarringWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {formatWeight(summary.totalStudEarringWeight)}
                    </td>
                    {/* Total weights */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.incomingTotalWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.outgoingTotalWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {formatWeight(summary.nonSaleTotalWeight)}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {formatWeight(summary.grandTotalWeight)}
                    </td>
                  </tr>
                  {/* Quantity row */}
                  <tr key={`${summary.date}-qty`} className="bg-gray-50">
                    {/* Ring quantities */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.incomingRingQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.outgoingRingQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.nonSaleRingQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {summary.totalRingQty}
                    </td>
                    {/* Earring quantities */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.incomingEarringQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.outgoingEarringQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.nonSaleEarringQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {summary.totalEarringQty}
                    </td>
                    {/* Necklace quantities */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.incomingNecklaceQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.outgoingNecklaceQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.nonSaleNecklaceQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {summary.totalNecklaceQty}
                    </td>
                    {/* Bracelet quantities */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.incomingBraceletQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.outgoingBraceletQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.nonSaleBraceletQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {summary.totalBraceletQty}
                    </td>
                    {/* Pendant quantities */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.incomingPendantQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.outgoingPendantQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.nonSalePendantQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {summary.totalPendantQty}
                    </td>
                    {/* Stud Earring quantities */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.incomingStudEarringQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.outgoingStudEarringQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.nonSaleStudEarringQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {summary.totalStudEarringQty}
                    </td>
                    {/* Total quantities */}
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.incomingTotalQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.outgoingTotalQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right">
                      {summary.nonSaleTotalQty}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-bold">
                      {summary.grandTotalQty}
                    </td>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && renderPagination()}

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lebur Barang</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Apakah kode / barcode masih ada?</Label>
                <Select onValueChange={(value) => setHasCode(value === "true")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ya</SelectItem>
                    <SelectItem value="false">Tidak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasCode === true && (
                <div className="grid gap-2">
                  <Label>Kode Barang</Label>
                  <Input
                    placeholder="Masukkan kode barang"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
              )}

              {hasCode === false && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <Label>Tipe Barang</Label>
                      <Select
                        onValueChange={(value) => {
                          setSelectedType(value);
                          const formData = new FormData();
                          formData.set("categoryId", "");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryGroups.map((group) => (
                            <SelectItem key={group.name} value={group.name}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem>
                      <Label>Kadar</Label>
                      <Select
                        disabled={!selectedType}
                        onValueChange={(value) => setSelectedCategoryId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kadar" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedType &&
                            categoryGroups
                              .find((g) => g.name === selectedType)
                              ?.karats.sort(
                                (a, b) =>
                                  parseInt(a.goldContent) -
                                  parseInt(b.goldContent)
                              )
                              .map((karat) => (
                                <SelectItem key={karat.id} value={karat.id}>
                                  {karat.name} - {karat.goldContent}K
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  </div>

                  <div className="grid gap-2">
                    <Label>Jumlah</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Berat Emas (g)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {hasCode !== null && (
                <div className="grid gap-2">
                  <Label>Catatan</Label>
                  <Input
                    placeholder="Masukkan catatan (opsional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  hasCode === null ||
                  isSubmitting ||
                  (hasCode === true && !code) ||
                  (hasCode === false && (!selectedCategoryId || !weight))
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Proses"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Riwayat Lebur Barang</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Tanggal</th>
                  <th className="border border-gray-300 p-2">Kode</th>
                  <th className="border border-gray-300 p-2">Kategori</th>
                  <th className="border border-gray-300 p-2">Kadar</th>
                  <th className="border border-gray-300 p-2">Berat (g)</th>
                  <th className="border border-gray-300 p-2">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-gray-300 p-4 text-center"
                    >
                      <Loader2 className="h-6 w-6 animate-spin inline-block" />
                    </td>
                  </tr>
                ) : !meltedItems || meltedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-gray-300 p-4 text-center"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  meltedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 p-2">
                        {format(new Date(item.date), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.code || "-"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.category.name}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.category.goldContent}K
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {item.weight}g
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {item.quantity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!historyLoading && renderHistoryPagination()}
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmationDialogOpen}
        onOpenChange={setConfirmationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Lebur Barang</DialogTitle>
          </DialogHeader>
          <div>
            <p>Nama Barang: {confirmationData?.name}</p>
            <p>Kode: {confirmationData?.code}</p>
            <p>Tkr: {confirmationData?.tkr}</p>
            <p>Berat: {confirmationData?.weight}g</p>
          </div>
          <Button onClick={processLebur}>Konfirmasi</Button>
          <Button onClick={() => setConfirmationDialogOpen(false)}>
            Batal
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
