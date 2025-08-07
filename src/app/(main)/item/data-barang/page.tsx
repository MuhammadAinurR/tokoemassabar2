'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Category {
  id: string;
  code: string;
  name: string;
  goldContent: number;
  itemCount: number;
  totalWeight: number;
}

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'code' | 'name' | 'goldContent' | 'itemCount' | 'totalWeight' | null;

interface DialogState {
  isOpen: boolean;
  selectedCode: string | null;
  selectedName: string | null;
}

const formatWeight = (weight: number): string => {
  // Convert the number to a string with German locale formatting
  const formattedNumber = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(weight);

  return formattedNumber;
};

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    selectedCode: null,
    selectedName: null,
  });

  const fetchCategories = async (field?: SortField, direction?: SortDirection) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (field) params.append('sortField', field);
      if (direction) params.append('sortDirection', direction);

      const response = await fetch(`/api/categories?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCategories(sortField, sortDirection);
  }, [sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const groupCategories = (categories: Category[]) => {
    return categories.reduce((acc, curr) => {
      const key = `${curr.code}-${curr.name}`;
      if (!acc[key]) {
        acc[key] = {
          code: curr.code,
          name: curr.name,
          itemCount: 0,
          totalWeight: 0,
          totalBerat24K_6K: 0,
          totalBerat24K_8K: 0,
          totalBerat24K_9K: 0,
          totalBerat24K_alt: 0,
        };
      }
      acc[key].itemCount += +curr.itemCount;
      acc[key].totalWeight += +curr.totalWeight;

      let berat24K = 0;
      let berat24K_alt = 0;
      if (curr.goldContent.toString().includes('15K')) {
        berat24K = Number(curr.totalWeight) * 0.72;
        berat24K_alt = Number(curr.totalWeight) * 0.63;
        acc[key].totalBerat24K_6K += berat24K;
        acc[key].totalBerat24K_alt += berat24K_alt;
      } else if (curr.goldContent.toString().includes('16K')) {
        berat24K = Number(curr.totalWeight) * 0.77;
        berat24K_alt = Number(curr.totalWeight) * 0.67;
        acc[key].totalBerat24K_8K += berat24K;
        acc[key].totalBerat24K_alt += berat24K_alt;
      } else if (curr.goldContent.toString().includes('17K')) {
        berat24K = Number(curr.totalWeight) * 0.85;
        berat24K_alt = Number(curr.totalWeight) * 0.72;
        acc[key].totalBerat24K_9K += berat24K;
        acc[key].totalBerat24K_alt += berat24K_alt;
      } else if (curr.goldContent.toString().includes('24K')) {
        berat24K = Number(curr.totalWeight) * 1.0;
        berat24K_alt = Number(curr.totalWeight) * 1.0;
        acc[key].totalBerat24K_9K += berat24K;
        acc[key].totalBerat24K_alt += berat24K_alt;
      }
      return acc;
    }, {} as Record<string, { code: string; name: string; itemCount: number; totalWeight: number; totalBerat24K_6K: number; totalBerat24K_8K: number; totalBerat24K_9K: number; totalBerat24K_alt: number }>);
  };

  const handleDetailsClick = (code: string, name: string) => {
    setDialog({
      isOpen: true,
      selectedCode: code,
      selectedName: name,
    });
  };

  const calculateTotals = () => {
    const totals = categories.reduce(
      (acc, curr) => ({
        totalItems: acc.totalItems + Number(curr.itemCount),
        totalWeight: acc.totalWeight + Number(curr.totalWeight),
        totalBerat24K:
          acc.totalBerat24K +
          (curr.goldContent.toString().includes('15K')
            ? Number(curr.totalWeight) * 0.72
            : curr.goldContent.toString().includes('16K')
            ? Number(curr.totalWeight) * 0.77
            : curr.goldContent.toString().includes('17K')
            ? Number(curr.totalWeight) * 0.85
            : curr.goldContent.toString().includes('24K')
            ? Number(curr.totalWeight) * 1.0
            : 0),
        totalBerat24K_alt:
          acc.totalBerat24K_alt +
          (curr.goldContent.toString().includes('15K')
            ? Number(curr.totalWeight) * 0.63
            : curr.goldContent.toString().includes('16K')
            ? Number(curr.totalWeight) * 0.67
            : curr.goldContent.toString().includes('17K')
            ? Number(curr.totalWeight) * 0.72
            : curr.goldContent.toString().includes('24K')
            ? Number(curr.totalWeight) * 1.0
            : 0),
      }),
      { totalItems: 0, totalWeight: 0, totalBerat24K: 0, totalBerat24K_alt: 0 }
    );
    return totals;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stok Barang</h1>
        <div className="text-right">
          <p className="text-gray-600">
            Total Barang: <span className="font-semibold">{calculateTotals().totalItems} Pcs</span>
          </p>
          <p className="text-gray-600">
            Total Berat: <span className="font-semibold">{formatWeight(calculateTotals().totalWeight)} Gram</span>
          </p>
          <p className="text-gray-600">
            Total Berat (24K):{' '}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-semibold cursor-help">
                    {formatWeight(calculateTotals().totalBerat24K)} Gram
                    <InfoCircledIcon className="inline ml-1 h-4 w-4 text-gray-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>15K: 0.72</p>
                  <p>16K: 0.77</p>
                  <p>17K: 0.85</p>
                  <p>24K: 1.00</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <p className="text-gray-600">
            Total Berat (24K) Alt:{' '}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-semibold cursor-help">
                    {formatWeight(calculateTotals().totalBerat24K_alt)} Gram
                    <InfoCircledIcon className="inline ml-1 h-4 w-4 text-gray-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>15K: 0.630</p>
                  <p>16K: 0.670</p>
                  <p>17K: 0.720</p>
                  <p>24K: 1.000</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sorted={sortField === 'code' ? sortDirection : null} onSort={() => handleSort('code')}>
                Kode
              </SortableTableHead>
              <SortableTableHead sorted={sortField === 'name' ? sortDirection : null} onSort={() => handleSort('name')}>
                Nama Kategori
              </SortableTableHead>
              <SortableTableHead
                sorted={sortField === 'itemCount' ? sortDirection : null}
                onSort={() => handleSort('itemCount')}
              >
                Jumlah Barang
              </SortableTableHead>
              <SortableTableHead
                sorted={sortField === 'totalWeight' ? sortDirection : null}
                onSort={() => handleSort('totalWeight')}
              >
                Total Berat
              </SortableTableHead>
              <SortableTableHead>
                Total Berat (24K)
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="inline ml-1 h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>15K: 0.72</p>
                      <p>16K: 0.77</p>
                      <p>17K: 0.85</p>
                      <p>24K: 1.00</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SortableTableHead>
              <SortableTableHead
                sorted={sortField === 'totalWeight' ? sortDirection : null}
                onSort={() => handleSort('totalWeight')}
              >
                Total Berat (24K) Alt
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="inline ml-1 h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>15K: 0.630</p>
                      <p>16K: 0.670</p>
                      <p>17K: 0.720</p>
                      <p>24K: 1.000</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SortableTableHead>
              <TableCell className="text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32">
                  Loading...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              Object.values(groupCategories(categories)).map((group) => (
                <TableRow key={`${group.code}-${group.name}`}>
                  <TableCell>{group.code}</TableCell>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.itemCount} Pcs</TableCell>
                  <TableCell>{group.totalWeight ? formatWeight(group.totalWeight) + ' Gram' : '0,000 Gram'}</TableCell>
                  <TableCell>
                    {formatWeight(group.totalBerat24K_6K + group.totalBerat24K_8K + group.totalBerat24K_9K) + ' Gram'}
                  </TableCell>
                  <TableCell>{formatWeight(group.totalBerat24K_alt) + ' Gram'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleDetailsClick(group.code, group.name)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog.isOpen} onOpenChange={(isOpen) => setDialog((prev) => ({ ...prev, isOpen }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Details for {dialog.selectedCode} - {dialog.selectedName}
            </DialogTitle>
          </DialogHeader>
          <div className="bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Kode</TableCell>
                  <TableCell>Kadar emas</TableCell>
                  <TableCell>Jumlah barang</TableCell>
                  <TableCell>Berat total</TableCell>
                  <TableCell>
                    Berat 24K
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoCircledIcon className="inline ml-1 h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>15K: 0.72</p>
                          <p>16K: 0.77</p>
                          <p>17K: 0.85</p>
                          <p>24K: 1.00</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    Berat 24K Alt
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoCircledIcon className="inline ml-1 h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>15K: 0.630</p>
                          <p>16K: 0.670</p>
                          <p>17K: 0.720</p>
                          <p>24K: 1.000</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories
                  .filter((cat) => cat.code === dialog.selectedCode && cat.name === dialog.selectedName)
                  .sort((a, b) => b.goldContent - a.goldContent)
                  .map((cat) => {
                    let berat24K = 0;
                    let berat24K_alt = 0;
                    if (cat.goldContent.toString().includes('15K')) {
                      berat24K = Number(cat.totalWeight) * 0.72;
                      berat24K_alt = Number(cat.totalWeight) * 0.63;
                    } else if (cat.goldContent.toString().includes('16K')) {
                      berat24K = Number(cat.totalWeight) * 0.77;
                      berat24K_alt = Number(cat.totalWeight) * 0.67;
                    } else if (cat.goldContent.toString().includes('17K')) {
                      berat24K = Number(cat.totalWeight) * 0.85;
                      berat24K_alt = Number(cat.totalWeight) * 0.72;
                    } else if (cat.goldContent.toString().includes('24K')) {
                      berat24K = Number(cat.totalWeight) * 1.0;
                      berat24K_alt = Number(cat.totalWeight) * 1.0;
                    }
                    return (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.code}</TableCell>
                        <TableCell>{cat.goldContent}</TableCell>
                        <TableCell>{cat.itemCount} Pcs</TableCell>
                        <TableCell>
                          {cat.totalWeight ? formatWeight(Number(cat.totalWeight)) + ' Gram' : '0,000 Gram'}
                        </TableCell>
                        <TableCell>{berat24K ? formatWeight(berat24K) + ' Gram' : '0,000 Gram'}</TableCell>
                        <TableCell>{berat24K_alt ? formatWeight(berat24K_alt) + ' Gram' : '0,000 Gram'}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
