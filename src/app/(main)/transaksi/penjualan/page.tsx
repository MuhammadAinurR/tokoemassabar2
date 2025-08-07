'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHeader, TableRow, SortableTableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Customer, Category, Grocery } from '@prisma/client';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { showToast } from '@/lib/showToast';
import { Eye, Loader2, Printer } from 'lucide-react';
import { numberToWords } from '@/lib/numberToWords';
import { getToday } from '@/lib/getToday';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatWeight } from '@/lib/weightFormater';
import { useAppMode } from '@/context/AppModeContext';
import { getApiEndpoint, getModeDisplayName } from '@/lib/modeUtils';
import type { AppMode } from '@/context/AppModeContext';

// Types
type SortField = 'code' | 'date' | 'customer.name' | 'grocery.weight' | 'sellPrice' | 'category.name';
type SortOrder = 'asc' | 'desc';

interface OutgoingItem {
  id: string;
  code: string;
  date: Date;
  customerId: string;
  weight: number;
  price: number;
  name?: string;
  customer?: Customer;
  category?: Category;
  grocery?: GroceryWithCategory;
  sellPrice: number;
}

interface GroceryWithCategory extends Grocery {
  sellPrice?: number;
  category?: {
    name: string;
    goldContent: number;
  };
}

interface CustomerSearchResult extends Customer {
  id: string;
  name: string;
  idNumber: string;
  address: string;
  phoneNumber: string | null;
}

// Validation Schemas
const newCustomerSchema = z.object({
  name: z.string().min(1).max(50),
  idNumber: z.string(),
  address: z.string().min(1),
  phoneNumber: z.string().max(15).optional(),
});

const saleSchema = z.object({
  groceryCode: z.string().min(1),
  customerId: z.string().min(1),
  sellPrice: z.number().min(0),
});

const generatePrintContent = async (
  sale: OutgoingItem | { customer: CustomerSearchResult; items: GroceryWithCategory[] }
) => {
  // Handle both single sale and multiple items cases
  const items = 'items' in sale ? sale.items : [sale];
  const customer = 'customer' in sale ? sale.customer : sale.customer;

  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Transaction Receipt</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
    <style>
      body {
        margin: 0;
        padding: 0;
      }
      .page {
        min-height: 100vh;
        background-image: url('');
        background-size: 100% 100%;
        background-repeat: no-repeat;
        background-position: center bottom;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        page-break-after: always;
      }
      .content {
        position: relative;
        top: 11px;
        left: 0;
        right: 0;
        z-index: 1;
        padding: 20px;
        font-family: Arial, sans-serif;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          margin: 0;
          size: A5 landscape;
        }
        .page {
          page-break-after: always;
        }
        .page:last-child {
          page-break-after: auto;
        }
      }

      .customer-info {
        position: absolute;
        top: 65.5px;
        left: 725px;
        right: 0;
        z-index: 1;
        font-size: 16px;
      }

      .customer-info .inner-customer-info {
        flex-direction: column;
        width: 230px;
        padding-right: 20px;
        padding-top: 6px;
      }

      .customer-info p {
        width: 190px;
        margin: 7px 0;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .date-box {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 5px;
      }

      .items-table {
        position: absolute;
        top: 240px;
        left: 73px;
        right: 0;
        z-index: 1;
        width: calc(100% - 80px);
        max-height: 10px;
        overflow: hidden;
        border-collapse: collapse;
        table-layout: fixed;
      }

      .items-table td {
        padding: 8px;
        padding-bottom: 5px;
        padding-left: 1px;
        text-align: left;
      }

      .items-table td:first-child { width: 126.67px; }
      .items-table td:nth-child(2) { width: 145.34px; }
      .items-table td:nth-child(3) { width: 307.45px; }
      .items-table td:nth-child(4) { width: 73.35px; }
      .items-table td:nth-child(5) { width: 91.67px; }
      .items-table td:nth-child(6) { width: 130.67px; }

      .total {
        position: absolute;
        top: 333px;
        left: 860px;
        right: 0;
        z-index: 1;
        font-weight: bold;
        font-size: 21px;
      }

      .total-terbilang {
        position: absolute;
        top: 370px;
        left: 510px;
        right: 0;
        z-index: 1;
        font-weight: bold;
        font-size: 22px;
        width: 380px;
      }

      .barcode-canvas {
        width: 100px;
        height: 15px;
      }
    </style>
  </head>
  <body>
    ${items
      .map(
        (item) => `
    <div class="page">
      <div class="content">
        <div class="customer-info">
          <div class="inner-customer-info">
            <div class="date-box">
              <span>${getToday().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}</span>
              &nbsp;&nbsp;${getToday().getFullYear().toString().slice(-2)}
            </div>
            <div class="info-box">
              <p>${customer?.name || ''}</p>
              <p>${customer?.address || ''}</p>
              <p>${customer?.phoneNumber || '-'}</p>
            </div>
          </div>
        </div>

        <table class="items-table">
          <tbody>
            <tr>
              <td class="first-column">
                <canvas id="barcode-${item.code}" class="barcode-canvas"></canvas>
              </td>
              <td class="fifth-column">${item.code}</td>
              <td class="second-child">${'grocery' in item ? item.grocery?.name : item.name || ''}</td>
              <td class="third-child">${
                'grocery' in item
                  ? String(item.grocery?.category?.goldContent).split(' ')[0]
                  : String(item.category?.goldContent).split(' ')[0] || ''
              }</td>
              <td class="fourth-column">${String('grocery' in item ? item.grocery?.weight : item.weight)}</td>
              <td class="six-column">${new Intl.NumberFormat('id-ID').format(Number(item.sellPrice))}</td>
            </tr>
          </tbody>
        </table>
        <div class="total">${new Intl.NumberFormat('id-ID').format(Number(item.sellPrice))}</div>
        <div class="total-terbilang">${numberToWords(Number(item.sellPrice))}</div>
      </div>
    </div>
    `
      )
      .join('')}

    <script>
      window.onload = function() {
        ${items
          .map(
            (item) => `
          JsBarcode("#barcode-${item.code}", "${item.code}", {
            format: "CODE128",
            width: 1,
            height: 85,
            displayValue: false,
            margin: 0,
            lineColor: "#000",
            background: "#fff"
          });
        `
          )
          .join('')}
        
        setTimeout(() => {
          window.print();
          window.onafterprint = function() {
            window.frameElement.remove();
          };
        }, 500);
      };
    </script>
  </body>
</html>
`;
};

const printReceipt = async (sale: OutgoingItem | { customer: CustomerSearchResult; items: GroceryWithCategory[] }) => {
  try {
    const printWindow = document.createElement('iframe');
    printWindow.style.display = 'none';
    document.body.appendChild(printWindow);

    const printContent = await generatePrintContent(sale);

    const doc = printWindow.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printContent);
      doc.close();
    }
  } catch (error) {
    console.error('Error printing receipt:', error);
    showToast('error', 'Terjadi kesalahan saat mencetak nota');
  }
};

const PenjualanPage: React.FC = () => {
  const { mode } = useAppMode();
  const [customerType, setCustomerType] = useState<'baru' | 'lama' | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sales, setSales] = useState<OutgoingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [minWeight, setMinWeight] = useState<string>('');
  const [maxWeight, setMaxWeight] = useState<string>('');

  const customerForm = useForm<z.infer<typeof newCustomerSchema>>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: {
      name: '',
      idNumber: '',
      address: '',
      phoneNumber: '',
    },
  });

  const saleForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      groceryCode: '',
      customerId: '',
      sellPrice: undefined,
    },
  });

  useEffect(() => {
    fetchSales();
  }, [sortField, sortOrder, currentPage, searchTerm, startDate, endDate, minWeight, maxWeight, mode]);

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

      // Use mode-appropriate API endpoint
      const apiEndpoint = getApiEndpoint('/api/sales', mode);
      const response = await fetch(`${apiEndpoint}?${params}`);
      const data = await response.json();
      setSales(data.data);
      setTotalPages(data.metadata.totalPages);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    setSortOrder(field === sortField ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortField(field);
  };

  const handleCustomerSearch = async (searchTerm: string) => {
    if (searchTerm.length < 3) return;
    try {
      const response = await fetch(`/api/customers/search?q=${searchTerm}`);
      const data = await response.json();

      // Filter to keep only the earliest entry for each name and address
      const filteredData = data
        .reduce((acc: CustomerSearchResult[], current: CustomerSearchResult) => {
          const key = `${current.name.toLowerCase()}|${current.address.toLowerCase()}`;
          if (!acc.some((item) => `${item.name.toLowerCase()}|${item.address.toLowerCase()}` === key)) {
            acc.push(current);
          }
          return acc;
        }, [])
        .sort((a: CustomerSearchResult, b: CustomerSearchResult) => {
          // First sort by name alphabetically
          const nameComparison = a.address.localeCompare(b.address);
          if (nameComparison !== 0) return nameComparison;

          // If names are the same, sort by createdAt date
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

      setSearchResults(filteredData);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCreateCustomer = async (data: z.infer<typeof newCustomerSchema>) => {
    try {
      // First, search for existing customers with the same name and address
      const response = await fetch(`/api/customers/search?q=${data.name}`);
      const existingCustomers: CustomerSearchResult[] = await response.json();

      // Check if any existing customer has the same name and address
      const matchingCustomer = existingCustomers.find(
        (customer) => customer.address.toLowerCase() === data.address.toLowerCase()
      );

      if (matchingCustomer) {
        // If a matching customer is found, set it as the selected customer
        setSelectedCustomer(matchingCustomer);
        showToast('info', "Customer sudah pernah dibuat, akan dipilih sebagai 'Customer Lama'");
        setCustomerType(null);
        customerForm.reset();
        return; // Exit the function early
      }

      // If no matching customer, proceed to create a new one
      const responseCreate = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!responseCreate.ok) throw new Error((await responseCreate.json()).message);

      const newCustomer = await responseCreate.json();
      setSelectedCustomer(newCustomer);
      setCustomerType(null);
      customerForm.reset();
      showToast('success', 'Customer berhasil ditambahkan');
    } catch (error) {
      console.error('Error creating customer:', error);
      showToast('error', 'Customer gagal ditambahkan');
    }
  };

  const handleCreateSale = async (data: z.infer<typeof saleSchema>) => {
    if (!selectedCustomer) {
      console.error('No customer selected');
      return;
    }

    try {
      const saleData = { ...data, customerId: selectedCustomer.id };
      // Use mode-appropriate API endpoint
      const apiEndpoint = getApiEndpoint('/api/sales', mode);
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.code === 'ITEM_SOLD') {
          showToast('error', 'Barang tidak tersedia');
          return;
        }
        throw new Error(responseData.message);
      }

      await fetchSales();
      setIsDialogOpen(false);
      resetForms();

      showToast('success', 'Penjualan berhasil disimpan');
    } catch (error) {
      showToast('error', 'Terjadi kesalahan saat memproses penjualan');
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
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setMinWeight('');
    setMaxWeight('');
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} mode={mode} />
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
                  className={cn('w-[140px] justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy') : 'Mulai'}
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
                  className={cn('w-[140px] justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy') : 'Akhir'}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Penjualan Baru</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <CustomerTypeSelection setCustomerType={setCustomerType} />
            {customerType === 'baru' && (
              <NewCustomerForm customerForm={customerForm} handleCreateCustomer={handleCreateCustomer} />
            )}
            {customerType === 'lama' && (
              <ExistingCustomerSearch
                handleCustomerSearch={handleCustomerSearch}
                searchResults={searchResults}
                setSelectedCustomer={setSelectedCustomer}
                setSearchResults={setSearchResults}
              />
            )}
            {selectedCustomer && (
              <SaleForm
                saleForm={saleForm}
                selectedCustomer={selectedCustomer}
                handleCreateSale={handleCreateSale}
                mode={mode}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
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
      <h1 className="text-3xl font-bold">Penjualan</h1>
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${
          mode === 'emas_muda' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
        }`}
      >
        {getModeDisplayName(mode)}
      </span>
    </div>
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gray-600 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
          Tambah Penjualan Baru
        </Button>
      </DialogTrigger>
    </Dialog>
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
          <SortableTableHead sorted={sortField === 'code' ? sortOrder : null} onSort={() => handleSort('code')}>
            Kode Barang
          </SortableTableHead>
          <SortableTableHead sorted={sortField === 'date' ? sortOrder : null} onSort={() => handleSort('date')}>
            Tanggal
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === 'customer.name' ? sortOrder : null}
            onSort={() => handleSort('customer.name')}
          >
            Nama Customer
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === 'category.name' ? sortOrder : null}
            onSort={() => handleSort('category.name')}
          >
            Nama Barang
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === 'category.name' ? sortOrder : null}
            onSort={() => handleSort('category.name')}
          >
            Tipe Barang
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === 'grocery.weight' ? sortOrder : null}
            onSort={() => handleSort('grocery.weight')}
          >
            Berat
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === 'grocery.weight' ? sortOrder : null}
            onSort={() => handleSort('grocery.weight')}
          >
            Kadar Emas
          </SortableTableHead>
          <SortableTableHead
            sorted={sortField === 'sellPrice' ? sortOrder : null}
            onSort={() => handleSort('sellPrice')}
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
              Tidak ada data penjualan
            </TableCell>
          </TableRow>
        ) : (
          sales.map((sale: OutgoingItem) => (
            <TableRow key={sale.id}>
              <TableCell>{sale.code}</TableCell>
              <TableCell>
                {new Date(sale.date).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell>{sale.customer?.name ?? sale.customerId}</TableCell>
              <TableCell>{sale.grocery?.name ?? '-'}</TableCell>
              <TableCell>{sale.category?.name ?? '-'}</TableCell>
              <TableCell>{sale.grocery?.weight ? `${formatWeight(Number(sale.grocery.weight))}g` : '-'}</TableCell>
              <TableCell>{sale.grocery?.category?.goldContent ?? '-'} Karat</TableCell>
              <TableCell>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                }).format(Number(sale.sellPrice ?? 0))}
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
                            <span>{sale.customer.phoneNumber || '-'}</span>

                            <span className="font-semibold">Transaksi Pertama:</span>
                            <span>{new Date(sale.customer.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" onClick={() => printReceipt(sale)}>
                    <Printer className="h-4 w-4" />
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
);

const CustomerTypeSelection = ({ setCustomerType }: { setCustomerType: (type: 'baru' | 'lama') => void }) => (
  <div className="grid gap-2">
    <label>Tipe Customer *</label>
    <Select onValueChange={(value) => setCustomerType(value as 'baru' | 'lama')} required>
      <SelectTrigger>
        <SelectValue placeholder="Pilih tipe customer" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="baru">Customer Baru</SelectItem>
        <SelectItem value="lama">Customer Lama</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const NewCustomerForm = ({
  customerForm,
  handleCreateCustomer,
}: {
  customerForm: UseFormReturn<z.infer<typeof newCustomerSchema>>;
  handleCreateCustomer: (data: z.infer<typeof newCustomerSchema>) => void;
}) => (
  <Form {...customerForm}>
    <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="grid gap-2">
      <FormField
        control={customerForm.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Customer *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Nama Customer" required />
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
            <FormLabel>Alamat *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Alamat" required />
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
    <label>Cari Customer *</label>
    <Input
      placeholder="Cari berdasarkan nama atau nomor KTP"
      onChange={(e) => handleCustomerSearch(e.target.value)}
      required
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

interface SelectedItem extends Grocery {
  sellPrice?: number;
}

const SaleForm = ({
  saleForm,
  selectedCustomer,
  handleCreateSale,
  mode,
}: {
  saleForm: UseFormReturn<z.infer<typeof saleSchema>>;
  selectedCustomer: CustomerSearchResult;
  handleCreateSale: (data: z.infer<typeof saleSchema>) => void;
  mode: AppMode;
}) => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [priceWarning, setPriceWarning] = useState<{ message: string; minimumPrice: number } | null>(null);

  const checkItemAvailability = async (groceryCode: string, sellPrice: number) => {
    if (selectedItems.some((item) => item.code === groceryCode)) {
      showToast('error', 'Barang sudah masuk di list');
      saleForm.reset({
        ...saleForm.getValues(),
        sellPrice: undefined,
      });
      return;
    }

    try {
      // Use mode-appropriate API endpoint
      const apiEndpoint = getApiEndpoint('/api/groceries', mode);
      const response = await fetch(`${apiEndpoint}/${groceryCode}`);

      if (response.status === 404) {
        showToast('error', 'Barang tidak tersedia');
        saleForm.reset({
          ...saleForm.getValues(),
          sellPrice: undefined,
        });
        return;
      }

      const data = await response.json();

      if (data.isSold) {
        showToast('error', 'Barang tidak tersedia');
        saleForm.reset({
          ...saleForm.getValues(),
          sellPrice: undefined,
        });
        return;
      }

      const minimumPrice = data.category.minimumPrice * parseFloat(data.weight);
      if (data.category.minimumPrice && sellPrice < minimumPrice) {
        setPriceWarning({
          message: `Harga minimum untuk barang ini adalah Rp ${new Intl.NumberFormat('id-ID').format(minimumPrice)}`,
          minimumPrice,
        });
        saleForm.reset({
          ...saleForm.getValues(),
          sellPrice: undefined,
        });
        return;
      }

      setPriceWarning(null);
      setSelectedItems((prevItems) => [...prevItems, { ...data, sellPrice }]);
      saleForm.reset({
        groceryCode: '',
        sellPrice: undefined,
        customerId: selectedCustomer.id,
      });
    } catch (error) {
      console.error('Error checking item availability:', error);
      showToast('error', 'Terjadi kesalahan saat memeriksa ketersediaan barang');
      saleForm.reset({
        ...saleForm.getValues(),
        sellPrice: undefined,
      });
    }
  };

  const removeItem = (code: string) => {
    setSelectedItems((prevItems) => prevItems.filter((item) => item.code !== code));
  };

  const processSale = async () => {
    setIsProcessing(true);
    try {
      const fetchImage = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const saleData = selectedItems.map((item) => ({
        groceryCode: item.code,
        customerId: selectedCustomer.id,
        sellPrice: item.sellPrice || Number(item.price),
      }));

      for (const data of saleData) {
        await handleCreateSale(data);
      }

      await printReceipt({
        customer: selectedCustomer,
        items: selectedItems,
      });

      setSelectedItems([]);
    } catch (error) {
      console.error('Error processing sale:', error);
      showToast('error', 'Terjadi kesalahan saat mencetak nota');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatNumber = (value: string) => {
    // Remove non-digit characters
    const number = value.replace(/\D/g, '');
    // Format with thousand separators
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const unformatNumber = (value: string) => {
    // Remove all non-digit characters and convert to number
    return Number(value.replace(/\D/g, ''));
  };

  return (
    <Form {...saleForm}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const { groceryCode, sellPrice } = saleForm.getValues();
          await checkItemAvailability(groceryCode, Number(sellPrice));
        }}
        className="grid gap-2"
      >
        <div className="bg-gray-200 p-2 rounded">
          <p>Nama Customer: {selectedCustomer.name}</p>
          <p>Alamat Customer: {selectedCustomer.address}</p>
        </div>
        <FormField
          control={saleForm.control}
          name="groceryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Barang</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Masukkan 10 Digit kode barang"
                  required
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={saleForm.control}
          name="sellPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Harga Jual</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ? formatNumber(String(field.value)) : ''}
                  type="text"
                  placeholder="Masukkan harga jual"
                  onChange={(e) => {
                    const value = unformatNumber(e.target.value);
                    field.onChange(value || undefined);
                  }}
                  required
                  className={priceWarning ? 'border-red-500 focus:ring-red-500' : ''}
                />
              </FormControl>
              {priceWarning && <p className="text-sm text-red-500 mt-1">{priceWarning.message}</p>}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Tambahkan Barang</Button>
      </form>

      {selectedItems.length > 0 && (
        <div className="grid gap-2 mt-2">
          <h3 className="font-bold">Barang yang Dipilih</h3>
          <ul>
            {selectedItems.map((item) => (
              <li key={item.code} className="flex justify-between items-center mb-2">
                <span>
                  {item.code} - {formatWeight(Number(item.weight))}g - Rp{' '}
                  {new Intl.NumberFormat('id-ID').format(item.sellPrice || Number(item.price))}
                </span>
                <Button variant="outline" size="sm" onClick={() => removeItem(item.code)}>
                  Hapus
                </Button>
              </li>
            ))}
          </ul>
          <Button onClick={processSale} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Proses Penjualan'
            )}
          </Button>
        </div>
      )}
    </Form>
  );
};

export default PenjualanPage;
