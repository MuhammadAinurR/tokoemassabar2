"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeader, TableRow, SortableTableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Customer, Category } from "@prisma/client";
import { Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/weightFormater";

// Types
type SortField =
  | "code"
  | "date"
  | "customer.name"
  | "category.name"
  | "category.totalWeight"
  | "category.goldContent"
  | "buyPrice"
  | "price"
  | "grocery.price"
  | "grocery.weight"
  | "grocery.category.name"
  | "grocery.category.goldContent";
type SortOrder = "asc" | "desc";

interface IncomingItem {
  id: string;
  name: string;
  code: string;
  date: Date;
  customerId: string;
  quantity: number;
  buyPrice?: number;
  price?: number;
  customer?: Customer;
  category?: Category;
  grocery?: {
    weight: number;
    price: number;
    category?: Category;
    tkr?: string;
  };
  isSold?: "terjual" | "belum terjual" | "lebur";
}

const BarangMasukPage: React.FC = () => {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [purchases, setPurchases] = useState<IncomingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [minWeight, setMinWeight] = useState<string>("");
  const [maxWeight, setMaxWeight] = useState<string>("");
  const [isSold, setIsSold] = useState<string>("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPurchases();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [sortField, sortOrder, currentPage, startDate, endDate, minWeight, maxWeight, searchQuery, isSold]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortField,
        order: sortOrder,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && {
          endDate: endDate ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString() : undefined,
        }),
        ...(minWeight && { minWeight }),
        ...(maxWeight && { maxWeight }),
        ...(isSold && { isSold }),
      });

      const response = await fetch(`/api/incoming-item?${params}`);
      const data = await response.json();

      setPurchases(data.items);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    setSortOrder(field === sortField ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    setSortField(field);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setMinWeight("");
    setMaxWeight("");
    setIsSold("");
    setCurrentPage(1);
  };

  const handleSearchQuery = (value: string) => {
    setCurrentPage(1);
    setSearchQuery(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="w-full">
            <Input
              placeholder="Cari berdasarkan nama barang, kode barang, tipe barang, atau nama customer..."
              value={searchQuery}
              onChange={(e) => handleSearchQuery(e.target.value)}
            />
          </div>
          {(searchQuery || startDate || endDate || minWeight || maxWeight || isSold) && (
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <select
              value={isSold}
              onChange={(e) => {
                setIsSold(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[150px] h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
            >
              <option value="">Semua</option>
              <option value="belum terjual">Belum Terjual</option>
              <option value="terjual">Terjual</option>
              <option value="lebur">Lebur</option>
            </select>
          </div>
        </div>
      </div>
      <PurchasesTable
        purchases={purchases}
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
    <h1 className="text-3xl font-bold">Barang Masuk</h1>
  </div>
);

const PurchasesTable = ({
  purchases,
  isLoading,
  sortField,
  sortOrder,
  handleSort,
  currentPage,
  setCurrentPage,
  totalPages,
}: {
  purchases: IncomingItem[];
  isLoading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  handleSort: (field: SortField) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}) => {
  const tableKey = useMemo(() => "purchases-table", []);

  return (
    <div className="bg-white shadow-md rounded-lg">
      <Table key={tableKey}>
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
              sorted={sortField === "grocery.category.name" ? sortOrder : null}
              onSort={() => handleSort("grocery.category.name")}
            >
              Tipe Barang
            </SortableTableHead>
            <TableCell>Berat</TableCell>
            <SortableTableHead
              sorted={sortField === "grocery.category.goldContent" ? sortOrder : null}
              onSort={() => handleSort("grocery.category.goldContent")}
            >
              Kadar Emas
            </SortableTableHead>
            <TableCell>TKR</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center h-32">
                Loading...
              </TableCell>
            </TableRow>
          ) : purchases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center h-32">
                Tidak ada data ditemukan
              </TableCell>
            </TableRow>
          ) : (
            purchases.map((purchase: IncomingItem) => (
              <TableRow key={purchase.id}>
                <TableCell>{purchase.code ?? "-"}</TableCell>
                <TableCell>
                  {new Date(purchase.date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>{purchase.name ?? "-"}</TableCell>
                <TableCell>{purchase.category?.name ?? purchase.grocery?.category?.name ?? "-"}</TableCell>
                <TableCell>{purchase.grocery?.weight ? `${formatWeight(purchase.grocery.weight)}g` : "-"}</TableCell>
                <TableCell>
                  {String(purchase.category?.goldContent ?? purchase.grocery?.category?.goldContent ?? "-")} Karat
                </TableCell>
                <TableCell>{purchase.grocery?.tkr ?? "-"}</TableCell>
                <TableCell>
                  {(() => {
                    switch (purchase.isSold) {
                      case "terjual":
                        return (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Terjual
                          </span>
                        );
                      case "lebur":
                        return (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Lebur
                          </span>
                        );
                      default:
                        return (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Belum Terjual
                          </span>
                        );
                    }
                  })()}
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
                        <DialogTitle>Detail Barang Masuk</DialogTitle>
                      </DialogHeader>
                      {purchase.customer && (
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold">Nama:</span>
                            <span>{purchase.customer.name}</span>

                            <span className="font-semibold">Nomor KTP:</span>
                            <span>{purchase.customer.idNumber}</span>

                            <span className="font-semibold">Alamat:</span>
                            <span>{purchase.customer.address}</span>

                            <span className="font-semibold">Nomor Telepon:</span>
                            <span>{purchase.customer.phoneNumber || "-"}</span>

                            <span className="font-semibold">Status:</span>
                            <span>{purchase.customer.isSupplier ? "Supplier" : "Customer"}</span>

                            <span className="font-semibold">Tanggal transaksi:</span>
                            <span>
                              {new Date(purchase.customer.createdAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>

                            <span className="font-semibold">Waktu:</span>
                            <span>
                              {(() => {
                                const hours = new Date(purchase.date).getHours();
                                const minutes = new Date(purchase.date).getMinutes().toString().padStart(2, "0");
                                const seconds = new Date(purchase.date).getSeconds().toString().padStart(2, "0");

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
};

export default BarangMasukPage;
