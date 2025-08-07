"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeader, TableRow, SortableTableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Category } from "@prisma/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PrinterIcon } from "lucide-react";
import { printLabel } from "@/lib/printLabel";
import { useRouter } from "next/navigation";

// Remove the import and define types directly
type SortField = "code" | "date" | "customer.name" | "isWashed" | "category";
type SortOrder = "asc" | "desc";

interface WashingItemType {
  id: string;
  newCode: string;
  incomingItem: {
    grocery: {
      weight: string;
      price: string;
      name: string;
      tkr?: string;
      code?: string;
    };
    name: string;
    code: string | null;
    date: Date;
    weight: string | null;
    price: string | null;
    categoryId: string;
    category: {
      name: string;
    };
    customer: {
      name: string;
      address: string;
      phoneNumber: string | null;
    };
  };
  isWashed: boolean;
  washedAt: Date | null;
  createdAt: Date;
}

const RiwayatCuciPage: React.FC = () => {
  const router = useRouter();
  // Similar state setup as TanggunganPage
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [items, setItems] = useState<WashingItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const loadPageData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      if (selectedCategory && selectedCategory !== "all") {
        params.append("categoryId", selectedCategory);
      }
      // Add status filter for completed items
      params.append("status", "completed");

      const [itemsResponse, categoriesResponse] = await Promise.all([
        fetch(
          `/api/washing-items?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&sort=${sortField}&order=${sortOrder}&${params.toString()}`
        ),
        fetch("/api/categories"),
      ]);

      const [itemsData, categoriesData] = await Promise.all([itemsResponse.json(), categoriesResponse.json()]);

      setItems(itemsData.data);
      setTotalPages(itemsData.totalPages);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading page data:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [currentPage, searchTerm, sortField, sortOrder, startDate, endDate, selectedCategory]);

  const handleSort = (field: SortField) => {
    setSortOrder(field === sortField ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    setSortField(field);
  };

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedCategory("all");
  };

  const uniqueCategories = useMemo(() => {
    const uniqueCats = categories.reduce((acc, current) => {
      const exists = acc.find((cat) => cat.name === current.name);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof categories);

    return uniqueCats.sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const printWashingItems = async (startDate: Date | undefined, endDate: Date | undefined) => {
    if (!startDate || !endDate) return;

    try {
      const params = new URLSearchParams();
      params.append("startDate", startDate.toISOString());
      params.append("endDate", new Date(endDate.setHours(23, 59, 59, 999)).toISOString());
      params.append("limit", "5000"); // Set a high limit to fetch all data
      params.append("page", "1");
      params.append("status", "completed"); // Add status filter for completed items

      const response = await fetch(`/api/washing-items?${params.toString()}`);
      const { data } = await response.json();

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const tableRows =
        data.length === 0
          ? `<tr><td colspan="7" style="text-align: center; padding: 0.5rem; font-weight: 500;">Tidak ada data pencucian</td></tr>`
          : data
              .map(
                (item: WashingItemType) => `
          <tr>
            <td>${item.incomingItem.code || "-"}</td>
            <td>${new Date(item.incomingItem.date).toLocaleDateString("id-ID")}</td>
            <td>${item.incomingItem.name}</td>
            <td>${
              item.incomingItem.weight !== "0" || !item.incomingItem.weight
                ? item.incomingItem.weight
                : item.incomingItem.grocery?.weight
            }g</td>
            <td>${item.incomingItem.category.name}</td>
            <td>${item.isWashed ? "Selesai" : "Dalam proses"}</td>
            <td>${item.washedAt ? new Date(item.washedAt).toLocaleDateString("id-ID") : "-"}</td>
          </tr>
        `
              )
              .join("");

      const tableHTML = `
        <html>
          <head>
            <title>Laporan Pencucian</title>
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
                margin-bottom: 0.5rem;
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
              h1 {
                text-align: center;
                margin-bottom: 0.5rem;
                font-size: 14px;
              }
              .date-range {
                text-align: center;
                margin-bottom: 0.5rem;
                font-size: 11px;
              }
              @media print {
                @page { 
                  size: portrait;
                  margin: 0.5cm;
                }
              }
            </style>
          </head>
          <body>
            <h1>Laporan Riwayat Pencucian</h1>
            <div class="date-range">
              Periode: ${startDate.toLocaleDateString("id-ID")} - ${endDate.toLocaleDateString("id-ID")}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Tgl Masuk</th>
                  <th>Nama</th>
                  <th>Berat</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Tgl Selesai</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Riwayat Pencucian</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/transaksi/tanggungan")} variant="outline">
            Kembali ke Daftar
          </Button>
          <Button
            onClick={() => printWashingItems(startDate, endDate)}
            className="flex items-center gap-2"
            disabled={!startDate || !endDate}
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-full">
          <Input
            placeholder="Cari berdasarkan nama barang, kode barang, tipe barang, atau nama customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex gap-2 items-center">
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Tanggal Mulai"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Tanggal Akhir"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>

          {(startDate || endDate || selectedCategory !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2">
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sorted={sortField === "code" ? sortOrder : null} onSort={() => handleSort("code")}>
                Kode Barang
              </SortableTableHead>
              <SortableTableHead sorted={sortField === "date" ? sortOrder : null} onSort={() => handleSort("date")}>
                Tanggal Masuk
              </SortableTableHead>
              <TableCell>Tanggal Selesai</TableCell>
              <TableCell>Nama Barang</TableCell>
              <TableCell>Berat</TableCell>
              <SortableTableHead
                sorted={sortField === "category" ? sortOrder : null}
                onSort={() => handleSort("category")}
              >
                Kategori
              </SortableTableHead>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Tidak ada riwayat pencucian
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.incomingItem.code}</TableCell>
                  <TableCell>
                    {new Date(item.incomingItem.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {item.washedAt
                      ? new Date(item.washedAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>{item.incomingItem.name}</TableCell>
                  <TableCell>
                    {item.incomingItem.grocery?.weight ? item.incomingItem.grocery?.weight : item.incomingItem.weight}g
                  </TableCell>
                  <TableCell>{item.incomingItem.category.name}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        item.isWashed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.isWashed ? <>Selesai</> : "Dalam proses"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detail Riwayat</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="font-semibold">Kode:</span>
                              <span>{item.incomingItem.code || "-"}</span>

                              <span className="font-semibold">Tanggal Masuk:</span>
                              <span>
                                {new Date(item.incomingItem.date).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>

                              <span className="font-semibold">Tanggal Selesai:</span>
                              <span>{item.washedAt ? new Date(item.washedAt).toLocaleString() : "-"}</span>

                              <span className="font-semibold">Berat:</span>
                              <span>
                                {item.incomingItem.weight !== "0" || !item.incomingItem.grocery.weight
                                  ? item.incomingItem.weight
                                  : item.incomingItem.grocery.weight}{" "}
                                g
                              </span>

                              <span className="font-semibold">Harga:</span>
                              <span>
                                {item.incomingItem.price && item.incomingItem.price !== "0"
                                  ? `Rp ${parseInt(item.incomingItem.price).toLocaleString()}`
                                  : `Rp ${parseInt(item.incomingItem.grocery.price).toLocaleString()}`}
                              </span>

                              <span className="font-semibold">Customer:</span>
                              <span>{item.incomingItem.customer.name}</span>

                              <span className="font-semibold">Alamat:</span>
                              <span>{item.incomingItem.customer.address}</span>

                              <span className="font-semibold">No. Telp:</span>
                              <span>{item.incomingItem.customer.phoneNumber || "-"}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          printLabel({
                            name: item.incomingItem.name ?? "",
                            code: item.newCode || item.incomingItem.code || "",
                            weight: parseFloat(
                              (item.incomingItem.grocery?.weight || item.incomingItem.weight || "0").toString()
                            ),
                            tkr: item.isWashed ? item.newCode?.substring(2, 4) || "" : "",
                          })
                        }
                      >
                        Print Label
                      </Button>
                    </div>
                  </TableCell>
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
    </div>
  );
};

export default RiwayatCuciPage;
