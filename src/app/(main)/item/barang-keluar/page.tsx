"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeader, TableRow, SortableTableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Customer, Category, Grocery } from "@prisma/client";
import { Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/weightFormater";

// Types
type SortField = "code" | "date" | "customer.name" | "grocery.weight" | "sellPrice" | "category.name";
type SortOrder = "asc" | "desc";

interface OutgoingItem {
  id: string;
  code: string;
  date: Date;
  customerId: string;
  weight: number;
  price: number;
  customer?: Customer;
  category?: Category;
  grocery?: Grocery;
  sellPrice?: number;
}

const BarangKeluarPage: React.FC = () => {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sales, setSales] = useState<OutgoingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [minWeight, setMinWeight] = useState<string>("");
  const [maxWeight, setMaxWeight] = useState<string>("");

  useEffect(() => {
    fetchSales();
  }, [sortField, sortOrder, currentPage, searchTerm, startDate, endDate, minWeight, maxWeight]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortField,
        order: sortOrder,
        page: currentPage.toString(),
        search: searchTerm,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && {
          endDate: endDate ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString() : undefined,
        }),
        ...(minWeight && { minWeight }),
        ...(maxWeight && { maxWeight }),
      });

      const response = await fetch(`/api/sales?${params}`);
      const data = await response.json();
      setSales(data.data);
      setTotalPages(data.metadata.totalPages);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSort = (field: SortField) => {
    setSortOrder(field === sortField ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    setSortField(field);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStartDate(null);
    setEndDate(null);
    setMinWeight("");
    setMaxWeight("");
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="w-full">
            <Input
              placeholder="Cari berdasarkan nama barang, kode barang, tipe barang, atau nama customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {(searchTerm || startDate || endDate || minWeight || maxWeight) && (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-9 px-4 ml-2">
              Reset Filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tanggal:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[140px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
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
                  className={cn("w-[140px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Berat (g):</span>
            <Input
              type="number"
              placeholder="Minimal Berat"
              value={minWeight}
              onChange={(e) => {
                setMinWeight(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[150px]"
              min="0"
              step="0.01"
            />
            <span>-</span>
            <Input
              type="number"
              placeholder="Maksimal Berat"
              value={maxWeight}
              onChange={(e) => {
                setMaxWeight(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[150px]"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>
      <SalesTable
        sales={sales}
        isLoading={isLoading}
        sortField={sortField}
        sortOrder={sortOrder}
        handleSort={handleSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  );
};

// Components
const Header = () => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold">Barang Keluar</h1>
  </div>
);

const SalesTable = ({
  sales,
  isLoading,
  sortField,
  sortOrder,
  handleSort,
  currentPage,
  setCurrentPage,
  totalPages,
}: {
  sales: OutgoingItem[];
  isLoading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  handleSort: (field: SortField) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}) => (
  <div className="bg-white shadow-md rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead sorted={sortField === "code" ? sortOrder : null} onSort={() => handleSort("code")}>
            Kode Barang
          </SortableTableHead>
          <SortableTableHead sorted={sortField === "date" ? sortOrder : null} onSort={() => handleSort("date")}>
            Tanggal
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === "customer.name" ? sortOrder : null}
            onSort={() => handleSort("customer.name")}
          >
            Nama Barang
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === "category.name" ? sortOrder : null}
            onSort={() => handleSort("category.name")}
          >
            Tipe Barang
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === "grocery.weight" ? sortOrder : null}
            onSort={() => handleSort("grocery.weight")}
          >
            Berat
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === "sellPrice" ? sortOrder : null}
            onSort={() => handleSort("sellPrice")}
          >
            Harga
          </SortableTableHead>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center h-32">
              Loading...
            </TableCell>
          </TableRow>
        ) : sales.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center h-32">
              Tidak ada data ditemukan
            </TableCell>
          </TableRow>
        ) : (
          sales.map((sale: OutgoingItem) => (
            <TableRow key={sale.id}>
              <TableCell>{sale.code}</TableCell>
              <TableCell>
                {new Date(sale.date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>{sale.grocery?.name ?? "-"}</TableCell>
              <TableCell>{sale.category?.name ?? "-"}</TableCell>
              <TableCell>{sale.grocery?.weight ? `${formatWeight(Number(sale.grocery.weight))}g` : "-"}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(Number(sale.sellPrice ?? 0))}
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="border">
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[600px] w-full">
                    <DialogHeader>
                      <DialogTitle>Detail Barang Keluar</DialogTitle>
                    </DialogHeader>
                    {sale.customer && (
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="font-semibold">Nama:</span>
                          <span>{sale.customer.name}</span>

                          <span className="font-semibold">Nomor KTP:</span>
                          <span>{sale.customer.idNumber}</span>

                          <span className="font-semibold">Alamat:</span>
                          <span>{sale.customer.address}</span>

                          <span className="font-semibold">Nomor Telepon:</span>
                          <span>{sale.customer.phoneNumber || "-"}</span>

                          <span className="font-semibold">Tanggal Transaksi:</span>
                          <span>
                            {new Date(sale.customer.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>

                          <span className="font-semibold">Waktu:</span>
                          <span>
                            {(() => {
                              const hours = new Date(sale.date).getHours();
                              const minutes = new Date(sale.date).getMinutes().toString().padStart(2, "0");
                              const seconds = new Date(sale.date).getSeconds().toString().padStart(2, "0");

                              let period;
                              let displayHours = hours;

                              if (hours >= 0 && hours < 11) {
                                period = "pagi";
                              } else if (hours >= 11 && hours < 15) {
                                period = "siang";
                              } else if (hours >= 15 && hours < 18) {
                                period = "sore";
                              } else {
                                period = "malam";
                              }

                              // Convert to 12-hour format
                              if (hours > 12) {
                                displayHours = hours - 12;
                              } else if (hours === 0) {
                                displayHours = 12;
                              }

                              return `Pukul ${displayHours} ${period}, menit ${minutes}, detik ${seconds}`;
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
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
);

export default BarangKeluarPage;
