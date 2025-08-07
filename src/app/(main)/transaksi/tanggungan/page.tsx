'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHeader, TableRow, SortableTableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Category } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { printLabel } from '@/lib/printLabel';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PrinterIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppMode, AppMode } from '@/context/AppModeContext';
import { getApiEndpoint, getModeDisplayName } from '@/lib/modeUtils';

// Types
type SortField = 'code' | 'date' | 'customer.name' | 'isWashed' | 'category';
type SortOrder = 'asc' | 'desc';

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

// Add new interface for history items
interface WashingHistoryType extends WashingItemType {
  completedAt?: Date; // Optional field to show when the washing was completed
}

// Validation Schemas
const groceryFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  code: z.string().min(1, 'Code is required').max(10),
  weight: z.string().min(1, 'Weight is required'),
  tkr: z.string().min(1, 'Kode TKR is required'),
  name: z.string().min(1, 'Name is required'),
  price: z.string().optional(),
});

type GroceryFormValues = z.infer<typeof groceryFormSchema>;

// Add this new component
const CompleteWashingDialog = ({
  item,
  categories,
  setCategories,
  onComplete,
  onOpenChange,
  mode,
}: {
  item: WashingItemType;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  onComplete: (id: string, formData: GroceryFormValues) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  mode: AppMode;
}) => {
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const codeGeneratedRef = useRef(false);

  const form = useForm<GroceryFormValues>({
    resolver: zodResolver(groceryFormSchema),
    defaultValues: {
      categoryId: '',
      code: '',
      weight: '',
      price: '0',
      tkr: '',
      name: '',
    },
  });

  // Reset form and generate code when dialog opens
  useEffect(() => {
    const initializeForm = async () => {
      // Reset form with item data
      form.reset({
        categoryId: item.incomingItem.categoryId || '',
        code: '',
        weight:
          item.incomingItem.weight?.toString() === '0'
            ? item.incomingItem.grocery?.weight
            : item.incomingItem.weight?.toString() || '',
        price: '0',
        tkr: item.incomingItem.grocery?.tkr || '',
        name: item.incomingItem.grocery?.name || item.incomingItem.name || '',
      });

      // Generate code if we have the category
      if (item.incomingItem.categoryId && categories.length > 0) {
        setIsGeneratingCode(true);
        try {
          await generateCode(item.incomingItem.categoryId);
        } catch (error) {
          console.error('Error generating code:', error);
        } finally {
          setIsGeneratingCode(false);
        }
      }
    };

    initializeForm();

    // Cleanup function
    return () => {
      setIsCodeGenerated(false);
      setIsGeneratingCode(false);
      codeGeneratedRef.current = false;
      form.reset();
    };
  }, [item.id, categories.length]); // Dependencies include categories.length

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Use mode-appropriate API endpoint
        const apiEndpoint = getApiEndpoint('/api/categories', mode);
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [mode]);

  const generateCode = async (categoryId: string) => {
    try {
      const selectedCategory = categories.find((cat) => cat.id === categoryId);
      if (!selectedCategory) return;

      // Use mode-appropriate API endpoint
      const apiEndpoint = getApiEndpoint('/api/groceries', mode);
      const response = await fetch(`${apiEndpoint}/latest-code?categoryCode=${selectedCategory.code}`);
      const latestGrocery = await response.json();

      // Generate mode-specific prefix
      const getModePrefix = (mode: AppMode) => {
        return mode === 'emas_muda' ? 'M' : 'T'; // M for Muda, T for Tua
      };

      const modePrefix = getModePrefix(mode);

      let newCode;
      if (!latestGrocery) {
        // Format: CategoryCode + Mode + AA + 000001
        newCode = `${selectedCategory.code}${modePrefix}AA000001`;
      } else {
        const currentCode = latestGrocery.code;

        // Check if the current code has the same mode prefix
        const currentModePrefix = currentCode.substring(2, 3); // Position 2 is where mode prefix is
        const series = currentCode.substring(3, 5); // Adjusted for mode prefix
        const number = parseInt(currentCode.substring(5)); // Adjusted for mode prefix

        if (currentModePrefix === modePrefix) {
          // Same mode, increment normally
          if (number === 999999) {
            const newSeries = String.fromCharCode(series.charCodeAt(0), series.charCodeAt(1) + 1);
            newCode = `${selectedCategory.code}${modePrefix}${newSeries}000001`;
          } else {
            newCode = `${selectedCategory.code}${modePrefix}${series}${(number + 1).toString().padStart(6, '0')}`;
          }
        } else {
          // Different mode, start fresh
          newCode = `${selectedCategory.code}${modePrefix}AA000001`;
        }
      }

      form.setValue('code', newCode);
      setIsCodeGenerated(true);
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  const onSubmit = async (data: GroceryFormValues) => {
    await onComplete(item.id, data);
    form.reset();
    setIsCodeGenerated(false);
    setIsGeneratingCode(false);
    codeGeneratedRef.current = false;
    onOpenChange(false);
  };
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Selesaikan Pencucian</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select disabled={true} onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>
                        {categories.find((cat) => cat.id === field.value)?.name || 'Loading...'}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.code} - {category.name} - {category.goldContent.toString()} Karat
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Baru</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input {...field} disabled={true} className="bg-muted" />
                    {isGeneratingCode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="animate-spin h-5 w-5 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Baru</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tkr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode TKR</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Berat Baru (g)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Contoh: 2.895"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+/, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batalkan
            </Button>
            <Button type="submit" disabled={!isCodeGenerated || isGeneratingCode}>
              {isGeneratingCode ? 'Generating...' : 'Daftarkan Perhiasan'}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
};

// Add new component for the history modal
const WashingHistoryModal = ({
  open,
  onOpenChange,
  searchTerm,
  itemsPerPage,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  itemsPerPage: number;
  mode: AppMode;
}) => {
  const [historyItems, setHistoryItems] = useState<WashingHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Combine fetchHistory and fetchCategories into a single function
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Use mode-appropriate API endpoints
      const washingItemsEndpoint = getApiEndpoint('/api/washing-items', mode);
      const categoriesEndpoint = getApiEndpoint('/api/categories', mode);

      const [historyResponse, categoriesResponse] = await Promise.all([
        fetch(
          `${washingItemsEndpoint}/history?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&sort=${sortField}&order=${sortOrder}&history=true`
        ),
        fetch(categoriesEndpoint),
      ]);

      const [historyData, categoriesData] = await Promise.all([historyResponse.json(), categoriesResponse.json()]);
      setHistoryItems(historyData.data);
      setTotalPages(historyData.totalPages);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Single useEffect for data loading
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, currentPage, sortField, sortOrder, searchTerm, mode]); // Dependencies that should trigger a reload

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat Pencucian</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="bg-white shadow-md rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sorted={sortField === 'code' ? sortOrder : null} onSort={() => handleSort('code')}>
                    Kode Barang
                  </SortableTableHead>
                  <SortableTableHead sorted={sortField === 'date' ? sortOrder : null} onSort={() => handleSort('date')}>
                    Tanggal Masuk
                  </SortableTableHead>
                  <TableCell>Tanggal Selesai</TableCell>
                  <SortableTableHead
                    sorted={sortField === 'customer.name' ? sortOrder : null}
                    onSort={() => handleSort('customer.name')}
                  >
                    Nama Customer
                  </SortableTableHead>
                  <SortableTableHead
                    sorted={sortField === 'category' ? sortOrder : null}
                    onSort={() => handleSort('category')}
                  >
                    Kategori
                  </SortableTableHead>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : historyItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Tidak ada riwayat pencucian
                    </TableCell>
                  </TableRow>
                ) : (
                  historyItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.incomingItem.name}</TableCell>
                      <TableCell>
                        {new Date(item.incomingItem.date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{item.washedAt ? new Date(item.washedAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{item.incomingItem.customer.name}</TableCell>
                      <TableCell>
                        {categories.find((cat) => cat.id === item.incomingItem.categoryId)?.name ||
                          item.incomingItem.categoryId}
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
                                  <span>{item.incomingItem.code || '-'}</span>

                                  <span className="font-semibold">Tanggal Masuk:</span>
                                  <span>
                                    {new Date(item.incomingItem.date).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}
                                  </span>

                                  <span className="font-semibold">Tanggal Selesai:</span>
                                  <span>{item.washedAt ? new Date(item.washedAt).toLocaleString() : '-'}</span>

                                  <span className="font-semibold">Berat:</span>
                                  <span>
                                    {item.incomingItem.weight !== '0' || !item.incomingItem.grocery.weight
                                      ? item.incomingItem.weight
                                      : item.incomingItem.grocery.weight}{' '}
                                    g
                                  </span>

                                  <span className="font-semibold">Harga:</span>
                                  <span>
                                    {item.incomingItem.price && item.incomingItem.price !== '0'
                                      ? `Rp ${parseInt(item.incomingItem.price).toLocaleString()}`
                                      : `Rp ${parseInt(item.incomingItem.grocery.price).toLocaleString()}`}
                                  </span>

                                  <span className="font-semibold">Customer:</span>
                                  <span>{item.incomingItem.customer.name}</span>

                                  <span className="font-semibold">Alamat:</span>
                                  <span>{item.incomingItem.customer.address}</span>

                                  <span className="font-semibold">No. Telp:</span>
                                  <span>{item.incomingItem.customer.phoneNumber || '-'}</span>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              printLabel({
                                name: item.incomingItem.name ?? '',
                                code: item.newCode || item.incomingItem.code || '',
                                weight: parseFloat(
                                  (item.incomingItem.weight ?? item.incomingItem.grocery?.weight ?? '0').toString()
                                ),
                                tkr: item.isWashed ? item.newCode?.substring(2, 4) || '' : '',
                              })
                            }
                          >
                            Print
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
      </DialogContent>
    </Dialog>
  );
};

const printWashingItems = async (startDate: Date | undefined, endDate: Date | undefined, mode: AppMode) => {
  if (!startDate || !endDate) return;

  try {
    const params = new URLSearchParams();
    params.append('startDate', startDate.toISOString());
    params.append('endDate', new Date(endDate.setHours(23, 59, 59, 999)).toISOString());
    params.append('limit', '5000'); // Set a high limit to fetch all data
    params.append('page', '1');
    params.append('status', 'pending');

    // Use mode-appropriate API endpoint
    const washingItemsEndpoint = getApiEndpoint('/api/washing-items', mode);
    const response = await fetch(`${washingItemsEndpoint}?${params.toString()}`);
    const { data } = await response.json();
    // Calculate summary data
    const summary = data.reduce((acc: any, item: WashingItemType) => {
      const categoryName = item.incomingItem.category.name;
      // Get weight from either incomingItem.weight or grocery.weight
      const weight = parseFloat(
        item.incomingItem.weight !== '0' && item.incomingItem.weight
          ? item.incomingItem.weight
          : item.incomingItem.grocery?.weight || '0'
      );

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
        .join('') +
      `
      <tr style="font-weight: bold; border-top: 2px solid #000;">
        <td>Total</td>
        <td>${totals.totalCount}</td>
        <td>${totals.totalWeight.toFixed(3)}g</td>
      </tr>
    `;

    // Sort data by category name
    const sortedData = [...data].sort((a: WashingItemType, b: WashingItemType) =>
      a.incomingItem.category.name.localeCompare(b.incomingItem.category.name)
    );

    const tableRows =
      sortedData.length === 0
        ? `<tr><td colspan="7" style="text-align: center; padding: 0.5rem; font-weight: 500;">Tidak ada data pencucian</td></tr>`
        : sortedData
            .map(
              (item: WashingItemType) => `
        <tr>
          <td>${item.incomingItem.code || '-'}</td>
          <td>${new Date(item.incomingItem.date).toLocaleDateString('id-ID')}</td>
          <td>${item.incomingItem.name}</td>
          <td>${
            item.incomingItem.weight !== '0' || !item.incomingItem.weight
              ? item.incomingItem.weight
              : item.incomingItem.grocery?.weight
          }g</td>
          <td>${item.incomingItem.category.name}</td>
          <td>${item.isWashed ? 'Selesai' : 'Dalam proses'}</td>
        </tr>
      `
            )
            .join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableHTML = `
      <html>
        <head>
          <title>Laporan Pencucian yang Belum Selesai</title>
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
          <h1>Laporan Pencucian yang Belum Selesai</h1>
          <div class="date-range">
            Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}
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
                <th>Tanggal</th>
                <th>Nama</th>
                <th>Berat</th>
                <th>Kategori</th>
                <th>Status</th>
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
    console.error('Failed to fetch print data:', error);
  }
};

const TanggunganPage: React.FC = () => {
  const router = useRouter();
  const { mode } = useAppMode();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [items, setItems] = useState<WashingItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleComplete = async (id: string, formData: GroceryFormValues) => {
    try {
      // Find the category from the categories array
      const category = categories.find((cat) => cat.id === formData.categoryId);

      const response = await fetch('/api/washing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          groceryData: {
            ...formData,
            category: {
              name: category?.name || '',
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete washing item');
      }

      // Print label and wait for it to complete
      const printResult = await printLabel({
        code: formData.code,
        name: formData.name ?? '',
        weight: parseFloat(formData.weight),
        tkr: formData.tkr,
      });

      // Reload data regardless of print result
      await loadPageData();
    } catch (error) {
      console.error('Error completing washing item:', error);
    }
  };

  // Move loadPageData function outside of useEffect so it can be called directly
  const loadPageData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }
      // Add status filter
      params.append('status', 'pending');

      // Use mode-appropriate API endpoints
      const washingItemsEndpoint = getApiEndpoint('/api/washing-items', mode);
      const categoriesEndpoint = getApiEndpoint('/api/categories', mode);

      const [itemsResponse, categoriesResponse] = await Promise.all([
        fetch(
          `${washingItemsEndpoint}?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&sort=${sortField}&order=${sortOrder}&${params.toString()}`
        ),
        fetch(categoriesEndpoint),
      ]);

      const [itemsData, categoriesData] = await Promise.all([itemsResponse.json(), categoriesResponse.json()]);

      setItems(itemsData.data);
      setTotalPages(itemsData.totalPages);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading page data:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to use the new loadPageData function
  useEffect(() => {
    loadPageData();
  }, [currentPage, searchTerm, sortField, sortOrder, startDate, endDate, selectedCategory, mode]);

  const handleSort = (field: SortField) => {
    setSortOrder(field === sortField ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortField(field);
  };

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedCategory('all');
  };

  // Add this function to get unique categories
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
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Daftar Pencucian</h1>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              mode === 'emas_muda' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {getModeDisplayName(mode)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/transaksi/riwayat-cuci')} variant="outline">
            Lihat Riwayat
          </Button>
          <Button
            onClick={() => printWashingItems(startDate, endDate, mode)}
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
                className={cn('justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Tanggal Mulai'}
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
                className={cn('justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : 'Tanggal Akhir'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>

          {(startDate || endDate || selectedCategory !== 'all') && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2">
              Reset
            </Button>
          )}
        </div>
      </div>

      <WashingItemsTable
        items={items}
        categories={categories}
        setCategories={setCategories}
        isLoading={isLoading}
        sortField={sortField}
        sortOrder={sortOrder}
        handleSort={handleSort}
        handleComplete={handleComplete}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        mode={mode}
      />

      <WashingHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        searchTerm={searchTerm}
        itemsPerPage={itemsPerPage}
        mode={mode}
      />
    </div>
  );
};

// Components
const WashingItemsTable = ({
  items,
  categories,
  setCategories,
  isLoading,
  sortField,
  sortOrder,
  handleSort,
  handleComplete,
  currentPage,
  setCurrentPage,
  totalPages,
  mode,
}: {
  items: WashingItemType[];
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  isLoading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  handleSort: (field: SortField) => void;
  handleComplete: (id: string, formData: GroceryFormValues) => Promise<void>;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  mode: AppMode;
}) => {
  const [selectedItem, setSelectedItem] = useState<WashingItemType | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const tableKey = useMemo(() => 'washing-items-table', []);

  return (
    <div className="bg-white shadow-md rounded-lg">
      <Table key={tableKey}>
        <TableHeader>
          <TableRow>
            <SortableTableHead sorted={sortField === 'code' ? sortOrder : null} onSort={() => handleSort('code')}>
              Kode Barang
            </SortableTableHead>
            <SortableTableHead sorted={sortField === 'date' ? sortOrder : null} onSort={() => handleSort('date')}>
              Tanggal Barang Masuk
            </SortableTableHead>
            <TableCell>Nama Barang</TableCell>
            <TableCell>Berat</TableCell>
            <SortableTableHead
              sorted={sortField === 'category' ? sortOrder : null}
              onSort={() => handleSort('category')}
            >
              Kategori
            </SortableTableHead>
            <SortableTableHead
              sorted={sortField === 'isWashed' ? sortOrder : null}
              onSort={() => handleSort('isWashed')}
            >
              Status
            </SortableTableHead>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No items found
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.incomingItem.code}</TableCell>
                <TableCell>
                  {new Date(item.incomingItem.date).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>{item.incomingItem.name}</TableCell>
                <TableCell>
                  {item.incomingItem.grocery?.weight ? item.incomingItem.grocery?.weight : item.incomingItem.weight}g
                </TableCell>
                <TableCell>{item.incomingItem.category.name}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      item.isWashed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.isWashed ? <>Selesai</> : 'Dalam proses'}
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
                          <DialogTitle>Detail Pembelian</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold">Kode:</span>
                            <span>{item.incomingItem.code || '-'}</span>

                            <span className="font-semibold">Tanggal:</span>
                            <span>
                              {new Date(item.incomingItem.date).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>

                            <span className="font-semibold">Berat:</span>
                            <span>
                              {item.incomingItem.weight !== '0' || !item.incomingItem.weight
                                ? item.incomingItem.weight
                                : item.incomingItem.grocery.weight}{' '}
                              g
                            </span>

                            <span className="font-semibold">Harga:</span>
                            <span>
                              {item.incomingItem.price && item.incomingItem.price !== '0'
                                ? `Rp ${parseInt(item.incomingItem.price).toLocaleString()}`
                                : `Rp ${parseInt(item?.incomingItem?.grocery?.price).toLocaleString()}`}
                            </span>

                            <span className="font-semibold">Customer:</span>
                            <span>{item.incomingItem.customer.name}</span>

                            <span className="font-semibold">Alamat:</span>
                            <span>{item.incomingItem.customer.address}</span>

                            <span className="font-semibold">No. Telp:</span>
                            <span>{item.incomingItem.customer.phoneNumber || '-'}</span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {item.isWashed ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          printLabel({
                            name: item.incomingItem.name ?? '',
                            code: item.newCode || item.incomingItem.code || '',
                            weight: parseFloat(
                              (item.incomingItem.weight ?? item.incomingItem.grocery?.weight ?? '0').toString()
                            ),
                            tkr: item.newCode?.substring(2, 4) || '',
                          })
                        }
                      >
                        Print Label
                      </Button>
                    ) : (
                      <Dialog
                        open={completeDialogOpen && selectedItem?.id === item.id}
                        onOpenChange={(open) => {
                          setCompleteDialogOpen(open);
                          if (!open) setSelectedItem(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                            Selesaikan Proses
                          </Button>
                        </DialogTrigger>
                        {selectedItem && (
                          <CompleteWashingDialog
                            item={selectedItem}
                            categories={categories}
                            setCategories={setCategories}
                            onComplete={handleComplete}
                            onOpenChange={setCompleteDialogOpen}
                            mode={mode}
                          />
                        )}
                      </Dialog>
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

export default TanggunganPage;
