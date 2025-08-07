"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  SortableTableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Customer, Category } from "@prisma/client";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Eye, Printer, Loader2 } from "lucide-react";
import { showToast } from "@/lib/showToast";
import { printLabel } from "@/lib/printLabel";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/weightFormater";
import { useAppMode, AppMode } from "@/context/AppModeContext";
import { getApiEndpoint, getModeDisplayName } from "@/lib/modeUtils";

// Types
type SortField =
  | "code"
  | "name"
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

// Define a specific type for the grocery property
interface Grocery {
  weight: number;
  price: number;
  category?: Category;
  tkr?: string;
}

interface OutgoingItem {
  grocery: Grocery; // Use the specific type instead of any
  id: string;
  code: string;
  date: Date;
  customerId: string;
  weight: number;
  price: number;
  customer?: Customer;
  category?: Category;
  tkr?: string;
  sellPrice?: number;
}

interface CustomerSearchResult extends Customer {
  id: string;
  name: string;
  idNumber: string;
  address: string;
  phoneNumber: string | null;
}

interface IncomingItem {
  id: string;
  code: string;
  name?: string;
  date: Date;
  customerId: string;
  quantity: number;
  buyPrice?: number;
  price?: number;
  customer?: Customer;
  category?: Category;
  grocery?: {
    name?: string;
    weight: number;
    price: number;
    category?: Category;
    tkr?: string;
  };
  tkr?: string;
  weight?: number;
  sellPrice?: number;
}

// Validation Schemas
const newCustomerSchema = z.object({
  name: z.string().min(1).max(50),
  idNumber: z.string().optional(),
  address: z.string().min(1),
  phoneNumber: z.string().max(15).optional(),
  isSupplier: z.boolean(),
});

const saleSchema = z.object({
  categoryId: z.string().min(1),
  customerId: z.string().min(1),
  quantity: z.number().min(1),
  weight: z.number().min(0),
  price: z.number().min(0),
  buyPrice: z.number().min(0),
  isPerhiasanKita: z.boolean({
    required_error: "Silakan pilih jenis perhiasan",
  }),
  code: z.string().optional(),
  tkr: z
    .string()
    .refine((val) => val && val.length > 0, {
      message: "TKR harus diisi untuk supplier",
      path: ["tkr"],
    })
    .optional(),
  sellPrice: z.number().optional(),
  name: z.string().min(1),
});

// Add these new interfaces
interface CategoryGroup {
  name: string;
  karats: {
    id: string;
    goldContent: string;
  }[];
}

// Add this helper function at the top of the file
const formatNumber = (value: string) => {
  // Remove any non-digit characters
  const number = value.replace(/\D/g, "");
  // Convert to number and format with thousand separators
  return number ? Number(number).toLocaleString("id-ID") : "";
};

const parseNumber = (value: string) => {
  // Remove thousand separators and convert to number
  return Number(value.replace(/\./g, ""));
};

const PembelianPage: React.FC = () => {
  const { mode, isLoading: modeLoading } = useAppMode();
  const [customerType, setCustomerType] = useState<
    "supplier" | "baru" | "lama" | null
  >(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [purchases, setPurchases] = useState<IncomingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>(
    []
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customerForm = useForm<z.infer<typeof newCustomerSchema>>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: {
      name: "",
      idNumber: "",
      address: "",
      phoneNumber: "",
    },
  });

  const saleForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: "",
      quantity: undefined,
      buyPrice: undefined,
    },
  });

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [minWeight, setMinWeight] = useState<string>("");
  const [maxWeight, setMaxWeight] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<
    "semua" | "customer" | "supplier"
  >("semua");

  // Add a form for supplier selection
  const supplierForm = useForm({
    defaultValues: {
      supplierId: "",
    },
  });

  useEffect(() => {
    if (!modeLoading && mode) {
      fetchPurchases();
    }
  }, [
    sortField,
    sortOrder,
    currentPage,
    searchQuery,
    startDate,
    endDate,
    minWeight,
    maxWeight,
    sourceFilter,
    mode,
  ]); // Removed modeLoading dependency to prevent extra calls

  useEffect(() => {
    if (!modeLoading && mode) {
      fetchCategories();
    }
  }, [mode]); // Simplified dependency - only fetch when mode changes

  // Separate effect to handle initial data load and mode changes
  useEffect(() => {
    if (!modeLoading && mode) {
      setCurrentPage(1); // Reset to first page when mode changes
      fetchPurchases();
    }
  }, [mode]); // Only depends on mode, not modeLoading

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      if (!modeLoading && mode) {
        fetchPurchases();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, mode, modeLoading]); // Added mode and modeLoading dependencies

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
          endDate: endDate
            ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString()
            : undefined,
        }),
        ...(minWeight && { minWeight }),
        ...(maxWeight && { maxWeight }),
        ...(sourceFilter !== "semua" && { source: sourceFilter }),
      });

      // Use different API endpoint based on mode
      const apiEndpoint = getApiEndpoint("/api/purchases", mode);
      const response = await fetch(`${apiEndpoint}?${params}`);
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

  const fetchCategories = async () => {
    try {
      // Use different API endpoint based on mode
      const apiEndpoint = getApiEndpoint("/api/categories", mode);
      const response = await fetch(apiEndpoint);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSort = (field: SortField) => {
    setSortOrder(
      field === sortField ? (sortOrder === "asc" ? "desc" : "asc") : "asc"
    );
    setSortField(field);
  };

  const handleCustomerSearch = async (searchTerm: string) => {
    if (searchTerm.length < 3) return;
    try {
      const response = await fetch(`/api/customers/search?q=${searchTerm}`);
      const data = await response.json();

      // Filter to keep only the earliest entry for each name and address
      const filteredData = data
        .reduce(
          (acc: CustomerSearchResult[], current: CustomerSearchResult) => {
            const key = `${current.name.toLowerCase()}|${current.address.toLowerCase()}`;
            if (
              !acc.some(
                (item) =>
                  `${item.name.toLowerCase()}|${item.address.toLowerCase()}` ===
                  key
              )
            ) {
              acc.push(current);
            }
            return acc;
          },
          []
        )
        .sort((a: CustomerSearchResult, b: CustomerSearchResult) => {
          // First sort by name alphabetically
          const nameComparison = a.address.localeCompare(b.address);
          if (nameComparison !== 0) return nameComparison;

          // If names are the same, sort by createdAt date
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

      setSearchResults(filteredData);
    } catch (error) {
      console.error("Error searching customers:", error);
    }
  };

  const handleCreateCustomer = async (
    data: z.infer<typeof newCustomerSchema>
  ) => {
    try {
      // First, search for existing customers with the same name and address
      const response = await fetch(`/api/customers/search?q=${data.name}`);
      const existingCustomers: CustomerSearchResult[] = await response.json();

      // Check if any existing customer has the same name and address
      const matchingCustomer = existingCustomers.find(
        (customer) =>
          customer.address.toLowerCase() === data.address.toLowerCase()
      );

      if (matchingCustomer) {
        // If a matching customer is found, set it as the selected customer
        setSelectedCustomer(matchingCustomer);
        showToast(
          "success",
          "Customer sudah pernah di buat, akan dipilih sebagai customer lama"
        );
        return; // Exit the function early
      }

      // If no matching customer, proceed to create a new one
      const responseCreate = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!responseCreate.ok)
        throw new Error((await responseCreate.json()).message);

      const newCustomer = await responseCreate.json();
      setSelectedCustomer(newCustomer);
      setCustomerType(null);
      customerForm.reset();
      showToast("success", "Customer berhasil ditambahkan");
    } catch (error) {
      console.error("Error creating customer:", error);
      showToast("error", "Customer gagal ditambahkan");
    }
  };

  const handleCreatePurchase = async (data: z.infer<typeof saleSchema>) => {
    if (!selectedCustomer) {
      console.error("No customer selected");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use different API endpoint based on mode
      const apiEndpoint = getApiEndpoint("/api/purchases", mode);
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          categoryId: data.categoryId,
          customerId: selectedCustomer.id,
          quantity: data.quantity,
          weight: data.weight,
          buyPrice: data.buyPrice || 0,
          price: data.price || 0,
          tkr: data.tkr,
          sellPrice: data.sellPrice || 0,
          ...(data.isPerhiasanKita && {
            isPerhiasanKita: data.isPerhiasanKita,
          }),
          ...(data.code && { code: data.code }),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      // Check if it's a supplier purchase and print labels
      if (selectedCustomer.isSupplier && result !== undefined) {
        // Handle both array and single object responses
        const purchases = Array.isArray(result) ? result : [result];
        purchases.forEach((item: IncomingItem) => {
          printLabel({
            code: item.code,
            name: item.name ?? "",
            weight: item.grocery?.weight ?? 0,
            tkr: item.grocery?.tkr ?? "",
          });
        });
      }

      await fetchPurchases();
      setIsDialogOpen(false);
      resetForms();
      showToast("success", "Pembelian berhasil");
      return result;
    } catch (error) {
      console.error("Error:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Gagal memproses pembelian"
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForms = () => {
    customerForm.reset();
    saleForm.reset();
    setSelectedCustomer(null);
    setCustomerType(null);
    setSearchResults([]);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setMinWeight("");
    setMaxWeight("");
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {modeLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Memuat mode aplikasi...</p>
          </div>
        </div>
      ) : (
        <>
          <Header
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            mode={mode}
          />
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="w-full">
                <Input
                  placeholder="Cari berdasarkan nama barang, kode barang, tipe barang, atau nama customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {(searchQuery ||
                startDate ||
                endDate ||
                minWeight ||
                maxWeight) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-4 ml-2"
                >
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
                      onSelect={(date) => setStartDate(date || null)}
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
                      onSelect={(date) => setEndDate(date || null)}
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
                <span className="text-sm font-medium whitespace-nowrap">
                  Asal Dari:
                </span>
                <Select
                  value={sourceFilter}
                  onValueChange={(value) =>
                    setSourceFilter(value as "semua" | "customer" | "supplier")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Pembelian Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {!selectedCustomer ? (
                  <>
                    <CustomerTypeSelection
                      setCustomerType={setCustomerType}
                      onTypeChange={() => {
                        setSelectedCustomer(null);
                        setSearchResults([]);
                        customerForm.reset();
                        saleForm.reset();
                      }}
                    />
                    {customerType === "supplier" && (
                      <SupplierSelection
                        setSelectedCustomer={setSelectedCustomer}
                        form={supplierForm}
                      />
                    )}
                    {customerType === "baru" && (
                      <NewCustomerForm
                        customerForm={customerForm}
                        handleCreateCustomer={handleCreateCustomer}
                      />
                    )}
                    {customerType === "lama" && (
                      <ExistingCustomerSearch
                        handleCustomerSearch={handleCustomerSearch}
                        searchResults={searchResults}
                        setSelectedCustomer={setSelectedCustomer}
                        setSearchResults={setSearchResults}
                      />
                    )}
                  </>
                ) : (
                  <SaleForm
                    saleForm={saleForm}
                    selectedCustomer={selectedCustomer}
                    categories={categories}
                    handleCreatePurchase={handleCreatePurchase}
                    setSelectedCustomer={setSelectedCustomer}
                    customerForm={customerForm}
                    setSearchResults={setSearchResults}
                    mode={mode}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

// Components
const Header = ({
  isDialogOpen,
  setIsDialogOpen,
  mode,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  mode: AppMode;
}) => (
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center gap-3">
      <h1 className="text-3xl font-bold">Pembelian</h1>
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gray-600 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
          Tambah Pembelian Baru
        </Button>
      </DialogTrigger>
    </Dialog>
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

  const handlePrintLabel = (purchase: IncomingItem) => {
    if (purchase.grocery) {
      printLabel({
        code: purchase.code ?? "",
        name: purchase.name ?? "",
        weight: purchase.grocery.weight ?? 0,
        tkr: purchase.grocery.tkr ?? "",
      });
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg">
      <Table key={tableKey}>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              sorted={sortField === "code" ? sortOrder : null}
              onSort={() => handleSort("code")}
            >
              Kode Barang
            </SortableTableHead>

            <SortableTableHead
              sorted={sortField === "date" ? sortOrder : null}
              onSort={() => handleSort("date")}
            >
              Tanggal
            </SortableTableHead>
            <SortableTableHead
              sorted={sortField === "customer.name" ? sortOrder : null}
              onSort={() => handleSort("customer.name")}
            >
              Nama Customer / Supplier
            </SortableTableHead>
            <SortableTableHead
              sorted={sortField === "name" ? sortOrder : null}
              onSort={() => handleSort("name")}
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
              sorted={
                sortField === "grocery.category.goldContent" ? sortOrder : null
              }
              onSort={() => handleSort("grocery.category.goldContent")}
            >
              Kadar Emas
            </SortableTableHead>
            <TableCell>Harga Asli</TableCell>
            <TableCell>Harga Beli</TableCell>
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
          ) : !purchases || purchases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center h-32">
                Tidak ada data pembelian
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
                <TableCell>
                  {purchase.customer?.name ?? purchase.customerId}
                </TableCell>
                <TableCell>{purchase.name ?? "-"}</TableCell>
                <TableCell>
                  {purchase.category?.name ??
                    purchase.grocery?.category?.name ??
                    "-"}
                </TableCell>
                <TableCell>
                  {purchase.grocery?.weight
                    ? `${formatWeight(purchase.grocery.weight)}g`
                    : purchase.weight
                    ? `${formatWeight(purchase.weight)}g`
                    : "-"}
                </TableCell>
                <TableCell>
                  {String(
                    purchase.category?.goldContent ??
                      purchase.grocery?.category?.goldContent ??
                      "-"
                  )}{" "}
                  Karat
                </TableCell>
                <TableCell>
                  {purchase.buyPrice && Number(purchase.buyPrice) !== 0
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(purchase.sellPrice ?? 0)
                    : "-"}
                </TableCell>
                <TableCell>
                  {purchase.buyPrice && Number(purchase.buyPrice) !== 0
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(purchase.buyPrice)
                    : purchase.price
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(purchase.price)
                    : new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(purchase.grocery?.price ?? 0)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detail Customer</DialogTitle>
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

                              <span className="font-semibold">
                                Nomor Telepon:
                              </span>
                              <span>
                                {purchase.customer.phoneNumber || "-"}
                              </span>

                              <span className="font-semibold">Status:</span>
                              <span>
                                {purchase.customer.isSupplier
                                  ? "Supplier"
                                  : "Customer"}
                              </span>

                              <span className="font-semibold">
                                Transaksi Pertama:
                              </span>
                              <span>
                                {new Date(
                                  purchase.customer.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {purchase.customer?.isSupplier && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintLabel(purchase)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
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
  );
};

const CustomerTypeSelection = ({
  setCustomerType,
  onTypeChange,
}: {
  setCustomerType: (type: "supplier" | "baru" | "lama") => void;
  onTypeChange: () => void;
}) => (
  <div className="grid gap-2">
    <label>Tipe Customer</label>
    <Select
      onValueChange={(value) => {
        onTypeChange();
        setCustomerType(value as "supplier" | "baru" | "lama");
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Pilih tipe customer" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="baru">Supplier / Customer Baru</SelectItem>
        <SelectItem value="supplier">Supplier Lama</SelectItem>
        <SelectItem value="lama">Customer Lama</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const SupplierSelection = ({
  setSelectedCustomer,
  form,
}: {
  setSelectedCustomer: (customer: CustomerSearchResult) => void;
  form: UseFormReturn<any>;
}) => {
  const [suppliers, setSuppliers] = useState<CustomerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  const boxSelectStyles = {
    container: "grid grid-cols-2 md:grid-cols-3 gap-4 mb-4",
    box: "border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-gray-400",
    boxSelected: "border-green-500 shadow-md",
    boxText: "text-center",
    boxTextSelected: "text-lg font-semibold",
    nextButton: "w-full mt-4",
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("/api/suppliers");
        const data = await response.json();
        setSuppliers(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        showToast("error", "Gagal mengambil data supplier");
        setSuppliers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSupplierSelect = (supplier: CustomerSearchResult) => {
    const supplierWithFlag = {
      ...supplier,
      isSupplier: true,
    };
    setSelectedSupplierId(supplier.id);
    setSelectedCustomer(supplierWithFlag);
  };

  if (isLoading) {
    return <div className="text-center py-2">Loading suppliers...</div>;
  }

  if (suppliers.length === 0) {
    return <div className="text-center py-2">Tidak ada supplier</div>;
  }

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block mb-2">
                Pilih Supplier<span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className={boxSelectStyles.container}>
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className={cn(
                        boxSelectStyles.box,
                        selectedSupplierId === supplier.id &&
                          boxSelectStyles.boxSelected
                      )}
                      onClick={() => {
                        handleSupplierSelect(supplier);
                        field.onChange(supplier.id);
                      }}
                    >
                      <p
                        className={cn(
                          boxSelectStyles.boxText,
                          selectedSupplierId === supplier.id &&
                            boxSelectStyles.boxTextSelected
                        )}
                      >
                        {supplier.name}
                      </p>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

const NewCustomerForm = ({
  customerForm,
  handleCreateCustomer,
}: {
  customerForm: UseFormReturn<z.infer<typeof newCustomerSchema>>;
  handleCreateCustomer: (data: z.infer<typeof newCustomerSchema>) => void;
}) => (
  <Form {...customerForm}>
    <form
      onSubmit={customerForm.handleSubmit(handleCreateCustomer)}
      className="grid gap-2"
    >
      <FormField
        control={customerForm.control}
        name="isSupplier"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Apakah Supplier?</FormLabel>
            <Select onValueChange={(value) => field.onChange(value === "true")}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Iya</SelectItem>
                <SelectItem value="false">Tidak</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={customerForm.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Customer / Supplier</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Nama Customer" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={customerForm.control}
        name="idNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nomor KTP</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Nomor KTP" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={customerForm.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alamat</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Alamat" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={customerForm.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nomor Telepon</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Nomor Telepon" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit">Simpan Customer</Button>
    </form>
  </Form>
);

const ExistingCustomerSearch = ({
  handleCustomerSearch,
  searchResults,
  setSelectedCustomer,
  setSearchResults,
}: {
  handleCustomerSearch: (searchTerm: string) => void;
  searchResults: CustomerSearchResult[];
  setSelectedCustomer: (customer: CustomerSearchResult) => void;
  setSearchResults: (results: CustomerSearchResult[]) => void;
}) => (
  <div className="grid gap-2">
    <label>Cari Customer</label>
    <Input
      placeholder="Cari berdasarkan nama atau nomor KTP"
      onChange={(e) => handleCustomerSearch(e.target.value)}
    />
    {searchResults.length > 0 && (
      <ul className="max-h-40 overflow-y-auto border rounded-md">
        {searchResults.map((customer) => (
          <li
            key={customer.id}
            className="p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              setSelectedCustomer(customer);
              setSearchResults([]);
            }}
          >
            {customer.name} - {customer.address}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const SaleForm = ({
  saleForm,
  selectedCustomer,
  categories,
  handleCreatePurchase,
  setSelectedCustomer,
  customerForm,
  setSearchResults,
  mode,
}: {
  saleForm: UseFormReturn<z.infer<typeof saleSchema>>;
  selectedCustomer: CustomerSearchResult;
  categories: Category[];
  handleCreatePurchase: (data: z.infer<typeof saleSchema>) => void;
  setSelectedCustomer: (customer: CustomerSearchResult | null) => void;
  customerForm: UseFormReturn<z.infer<typeof newCustomerSchema>>;
  setSearchResults: (results: CustomerSearchResult[]) => void;
  mode: AppMode;
}) => {
  const [isPerhiasanKita, setIsPerhiasanKita] = useState<boolean | null>(null);
  const [outgoingItem, setOutgoingItem] = useState<OutgoingItem | null>(null);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightDisplayValue, setWeightDisplayValue] = useState<string>("");

  useEffect(() => {
    const groups = categories.reduce((acc: CategoryGroup[], curr) => {
      const baseName = curr.name.split(" - ")[0];
      const group = acc.find((g) => g.name === baseName);

      if (group) {
        group.karats.push({
          id: curr.id,
          goldContent: curr.goldContent,
        });
      } else {
        acc.push({
          name: baseName,
          karats: [
            {
              id: curr.id,
              goldContent: curr.goldContent,
            },
          ],
        });
      }

      return acc;
    }, []);

    setCategoryGroups(groups);
  }, [categories]);

  useEffect(() => {
    const savedType = localStorage.getItem("lastSelectedType");
    if (savedType) {
      setSelectedType(savedType);
    } else if (categoryGroups.length > 0) {
      // If no saved type, select the first option
      setSelectedType(categoryGroups[0].name);
    }
  }, [categoryGroups]);

  const handleIsPerhiasanKitaChange = (value: string) => {
    const isKita = value === "true";
    setIsPerhiasanKita(isKita);

    // Reset form values when toggling isPerhiasanKita
    if (isKita) {
      saleForm.setValue("categoryId", "");
      saleForm.setValue("quantity", 0);
      saleForm.setValue("weight", 0);
      saleForm.setValue("price", 0);
      setWeightDisplayValue("");
    } else {
      saleForm.setValue("code", "");
      saleForm.setValue("buyPrice", 0);
      setOutgoingItem(null);
      setWeightDisplayValue("");
    }
  };

  const handleCodeChange = async (code: string) => {
    // Update the form field value
    saleForm.setValue("code", code);

    // If code is not exactly 10 characters, reset the form
    if (code.length !== 10) {
      setOutgoingItem(null);
      saleForm.setValue("categoryId", "");
      saleForm.setValue("quantity", 0);
      saleForm.setValue("weight", 0);
      saleForm.setValue("price", 0);
      saleForm.setValue("buyPrice", 0);
      saleForm.setValue("sellPrice", undefined);
      saleForm.setValue("name", ""); // Reset name field
      return;
    }

    try {
      const response = await fetch(`/api/outgoing-items/${code}`);
      if (!response.ok) {
        throw new Error("Failed to fetch item");
      }
      const item = await response.json();
      setOutgoingItem(item);

      // Auto-fill form fields with item data
      saleForm.setValue("categoryId", item.categoryId || "");
      saleForm.setValue("quantity", item.quantity || 0);
      saleForm.setValue("weight", item.weight || 0);
      saleForm.setValue("price", item.price || 0);
      saleForm.setValue("buyPrice", item.price || 0);
      saleForm.setValue("sellPrice", item.sellPrice || undefined);
      saleForm.setValue("name", item.grocery?.name || item.name || "");
    } catch (error) {
      console.error("Error fetching item:", error);
      showToast("error", "Kode barang tidak ditemukan");
      setOutgoingItem(null);
      // Reset form fields
      saleForm.setValue("categoryId", "");
      saleForm.setValue("quantity", 0);
      saleForm.setValue("weight", 0);
      saleForm.setValue("price", 0);
      saleForm.setValue("buyPrice", 0);
      saleForm.setValue("sellPrice", undefined);
      saleForm.setValue("name", "");
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const formData = saleForm.getValues();

    // Update validation logic to check appropriate price field
    if (!selectedCustomer.isSupplier) {
      const priceToCheck = isPerhiasanKita ? formData.buyPrice : formData.price;
      if (!priceToCheck || priceToCheck === 0) {
        showToast("error", "Harga harus diisi untuk pembelian dari customer");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await handleCreatePurchase({ ...formData, quantity: 1 });
    } catch (error) {
      console.error("Error:", error);
      showToast("error", "Gagal memproses pembelian");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new styles for the box select
  const boxSelectStyles = {
    container: "grid grid-cols-2 md:grid-cols-3 gap-4 mb-4",
    box: "border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-gray-400",
    boxSelected: "border-green-500 shadow-md",
    boxText: "text-center",
    boxTextSelected: "text-lg font-semibold",
    nextButton: "w-full mt-4",
  };

  // Add state for showing additional fields
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  const handleTypeSelect = (typeName: string) => {
    setSelectedType(typeName);
    localStorage.setItem("lastSelectedType", typeName);
  };

  return (
    <Form {...saleForm}>
      <form onSubmit={handleSubmit} className="grid gap-2">
        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
          <div>
            <p className="font-medium">
              {selectedCustomer.isSupplier ? "Supplier" : "Customer"}:{" "}
              <span className="text-green-600">{selectedCustomer.name}</span>
            </p>
            <p className="text-sm text-gray-600">{selectedCustomer.address}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCustomer(null);
              setSearchResults([]);
              customerForm.reset();
              saleForm.reset();
            }}
          >
            Ubah
          </Button>
        </div>

        {!selectedCustomer.isSupplier && (
          <FormField
            control={saleForm.control}
            name="isPerhiasanKita"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Apakah ini perhiasan kita?
                  <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  required
                  onValueChange={(value) => {
                    field.onChange(value === "true");
                    handleIsPerhiasanKitaChange(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Iya</SelectItem>
                    <SelectItem value="false">Tidak</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(selectedCustomer.isSupplier ||
          (!selectedCustomer.isSupplier && isPerhiasanKita === false)) && (
          <>
            {!showAdditionalFields ? (
              <div className="space-y-4">
                <FormLabel className="block mb-2">
                  Tipe Barang<span className="text-red-500">*</span>
                </FormLabel>
                <div
                  className={
                    categoryGroups.length > 0
                      ? boxSelectStyles.container
                      : "mb-4"
                  }
                >
                  {categoryGroups.length > 0 ? (
                    categoryGroups.map((group) => (
                      <div
                        key={group.name}
                        className={cn(
                          boxSelectStyles.box,
                          selectedType === group.name &&
                            boxSelectStyles.boxSelected
                        )}
                        onClick={() => handleTypeSelect(group.name)}
                      >
                        <p
                          className={cn(
                            boxSelectStyles.boxText,
                            selectedType === group.name &&
                              boxSelectStyles.boxTextSelected
                          )}
                        >
                          {group.name}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-600 mb-3">
                        Kategori barang untuk{" "}
                        {mode === "emas_muda" ? "emas muda" : "emas tua"} belum
                        ada.
                      </p>
                      <Link
                        href="/master/category"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        Klik disini untuk membuat kategori
                      </Link>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  className={boxSelectStyles.nextButton}
                  disabled={!selectedType || categoryGroups.length === 0}
                  onClick={() => setShowAdditionalFields(true)}
                >
                  Lanjutkan
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                <div>
                  <p className="font-medium">
                    Tipe Barang:{" "}
                    <span className="text-green-600">{selectedType}</span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAdditionalFields(false);
                    setSelectedType("");
                    setWeightDisplayValue("");
                    saleForm.setValue("categoryId", "");
                  }}
                >
                  Ubah
                </Button>
              </div>
            )}

            {showAdditionalFields && (
              <div className="space-y-4">
                <FormField
                  control={saleForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kadar<span className="text-red-500">*</span>
                      </FormLabel>
                      <Select required onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kadar" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedType &&
                            categoryGroups
                              .find((g) => g.name === selectedType)
                              ?.karats.sort((a, b) =>
                                a.goldContent.localeCompare(b.goldContent)
                              )
                              .map((karat) => (
                                <SelectItem key={karat.id} value={karat.id}>
                                  {karat.goldContent} Karat
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={saleForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Berat (g)<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          required
                          type="text"
                          step="0.001"
                          placeholder="0"
                          value={weightDisplayValue}
                          onChange={(e) => {
                            let value = e.target.value;
                            // Replace comma with dot for decimal separator
                            value = value.replace(",", ".");
                            // Only allow numbers and one decimal point
                            if (/^\d*\.?\d*$/.test(value) || value === "") {
                              setWeightDisplayValue(e.target.value); // Keep original input with comma
                              const numericValue =
                                value === "" ? 0 : Number(value);
                              field.onChange(numericValue);
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.replace(",", ".");
                            const numericValue =
                              value === "" ? 0 : Number(value);
                            field.onChange(
                              isNaN(numericValue) ? 0 : numericValue
                            );
                            // Update display value to show the formatted number if it's valid
                            if (!isNaN(numericValue) && value !== "") {
                              setWeightDisplayValue(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={saleForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Harga Beli
                        {!selectedCustomer.isSupplier && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          required={!selectedCustomer.isSupplier}
                          placeholder="0"
                          value={formatNumber(field.value?.toString() || "")}
                          onChange={(e) => {
                            const formattedValue = formatNumber(e.target.value);
                            const numericValue = parseNumber(formattedValue);
                            field.onChange(
                              isNaN(numericValue) ? 0 : numericValue
                            );
                          }}
                          onBlur={(e) => {
                            const value = parseNumber(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedCustomer.isSupplier && (
                  <FormField
                    control={saleForm.control}
                    name="tkr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          TKR<span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            required
                            placeholder="Masukkan TKR"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              // Trigger form validation
                              saleForm.trigger("tkr");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={saleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Barang<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          required
                          {...field}
                          placeholder="Masukkan nama barang"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </>
        )}

        {isPerhiasanKita === true && (
          <>
            <FormField
              control={saleForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kode Barang<span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      required
                      {...field}
                      maxLength={10}
                      placeholder="Masukkan kode barang (10 digit)"
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        field.onChange(value);
                        handleCodeChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {outgoingItem ? (
              <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                <p className="font-medium">Detail Barang:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Tanggal Pembelian:</p>
                  <p>{new Date(outgoingItem.date).toLocaleDateString()}</p>

                  <p>Customer Sebelumnya:</p>
                  <p>{outgoingItem?.customer?.name ?? "-"}</p>

                  <p>Nomor Telepon:</p>
                  <p>{outgoingItem?.customer?.phoneNumber ?? "-"}</p>

                  <p>Harga Jual Sebelumnya:</p>
                  <p>
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(outgoingItem?.sellPrice ?? 0)}
                  </p>
                </div>

                <FormField
                  control={saleForm.control}
                  name="buyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Harga Beli<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          required
                          placeholder="0"
                          value={formatNumber(field.value?.toString() || "")}
                          onChange={(e) => {
                            const formattedValue = formatNumber(e.target.value);
                            const numericValue = parseNumber(formattedValue);
                            field.onChange(
                              isNaN(numericValue) ? 0 : numericValue
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              saleForm.getValues("code")?.length === 10 && (
                <p className="text-red-500 text-sm">
                  Kode barang tidak ditemukan
                </p>
              )
            )}
          </>
        )}

        {!isPerhiasanKita && showAdditionalFields && (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Proses Pembelian"
            )}
          </Button>
        )}

        {isPerhiasanKita && (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Proses Pembelian"
            )}
          </Button>
        )}
      </form>
    </Form>
  );
};

export default PembelianPage;
