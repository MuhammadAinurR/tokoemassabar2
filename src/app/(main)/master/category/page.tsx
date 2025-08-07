'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import Modal from '@/components/ui/modal';
import { useForm } from 'react-hook-form';
import { useAppMode } from '@/context/AppModeContext';
import { getApiEndpoint } from '@/lib/modeUtils';

// Add number formatting utility
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
};

const parseCurrency = (value: string): number => {
  return Number(value.replace(/\./g, ''));
};

interface Category {
  id: string;
  code: string;
  name: string;
  goldContent: string;
  itemCount: number;
  totalWeight: number;
  minimumPrice: number | null;
}

interface CategoryFormData extends Omit<Category, 'minimumPrice'> {
  minimumPrice: string | undefined;
}

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'code' | 'name' | 'goldContent' | 'itemCount' | 'totalWeight' | 'minimumPrice' | null;

export default function CategoryPage() {
  const { mode } = useAppMode();
  const [categories, setCategories] = useState<Category[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryCodeMap: { [key: string]: string } = {
    Cincin: 'CN',
    Anting: 'AT',
    Kalung: 'KL',
    Gelang: 'GL',
    Liontin: 'LT',
    Giwang: 'GW',
  };

  const fetchCategories = async (field?: SortField, direction?: SortDirection) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (field) params.append('sortField', field);
      if (direction) params.append('sortDirection', direction);

      const categoriesEndpoint = getApiEndpoint('/api/categories', mode);
      const response = await fetch(`${categoriesEndpoint}?${params.toString()}`);
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
    fetchCategories(sortField, sortDirection);
  }, [sortField, sortDirection, mode]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setError(null);
      const code = categoryCodeMap[data.name];
      const submitData = {
        ...data,
        code,
        minimumPrice: data.minimumPrice ? parseCurrency(data.minimumPrice) : null,
      };

      const categoriesEndpoint = getApiEndpoint('/api/categories', mode);
      const response = await fetch(categoriesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      await fetchCategories(sortField, sortDirection);
      setIsModalOpen(false);
      reset({
        name: '',
        goldContent: undefined,
        minimumPrice: undefined,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Failed to add category:', error);
      }
    }
  };

  const handleEdit = async (data: CategoryFormData) => {
    try {
      setError(null);

      const submitData = {
        id: selectedCategory?.id,
        minimumPrice: data.minimumPrice ? parseCurrency(data.minimumPrice) : null,
      };

      const categoriesEndpoint = getApiEndpoint('/api/categories', mode);
      const response = await fetch(categoriesEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      await fetchCategories(sortField, sortDirection);
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      reset({
        minimumPrice: undefined,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Failed to update category:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === id);

    if (categoryToDelete && (categoryToDelete.itemCount > 0 || categoryToDelete.totalWeight > 0)) {
      alert('Tidak dapat menghapus kategori jika jumlah barang lebih dari 0');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      return;
    }

    try {
      const categoriesEndpoint = getApiEndpoint('/api/categories', mode);
      const response = await fetch(`${categoriesEndpoint}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      await fetchCategories(sortField, sortDirection);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message || 'Failed to delete category');
        console.error('Failed to delete category:', error);
      }
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kategori Barang</h1>
        <Button
          className="bg-gray-600 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          Tambah Kategori
        </Button>
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
                sorted={sortField === 'goldContent' ? sortDirection : null}
                onSort={() => handleSort('goldContent')}
              >
                Kadar Emas
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
              <SortableTableHead
                sorted={sortField === 'minimumPrice' ? sortDirection : null}
                onSort={() => handleSort('minimumPrice')}
              >
                Harga Minimum
              </SortableTableHead>
              <SortableTableHead>Aksi</SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.code}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.goldContent}</TableCell>
                  <TableCell>{category.itemCount}</TableCell>
                  <TableCell>{category.totalWeight}</TableCell>
                  <TableCell>{formatCurrency(category.minimumPrice)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsEditModalOpen(true);
                        reset({
                          ...category,
                          minimumPrice: category.minimumPrice ? formatCurrency(category.minimumPrice) : undefined,
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal for adding new category */}
      {isModalOpen && (
        <Modal
          onClose={() => {
            setIsModalOpen(false);
            setError(null);
            reset({
              name: '',
              goldContent: undefined,
              minimumPrice: undefined,
            });
          }}
        >
          <div className="max-w-3xl">
            <form onSubmit={handleSubmit(onSubmit)} className="p-4">
              <h2 className="text-lg font-bold mb-4">Tambah Kategori</h2>
              {error && <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

              <div>
                <label className="block mb-1">Nama Kategori</label>
                <select {...register('name', { required: true })} className="border p-2 w-full">
                  <option value="">Pilih Kategori</option>
                  <option value="Cincin">Cincin</option>
                  <option value="Anting">Anting</option>
                  <option value="Kalung">Kalung</option>
                  <option value="Gelang">Gelang</option>
                  <option value="Liontin">Liontin</option>
                  <option value="Giwang">Giwang</option>
                </select>
                {errors.name && <span className="text-red-500 text-sm">Nama kategori harus dipilih</span>}
              </div>

              <div className="mt-2">
                <label className="block mb-1">Kadar Emas</label>
                <input
                  type="text"
                  step="0.01"
                  {...register('goldContent', {
                    required: true,
                    min: 0,
                    max: 24,
                  })}
                  className="border p-2 w-full"
                />
                {errors.goldContent && <span className="text-red-500 text-sm">Kadar emas harus antara 0 dan 24</span>}
              </div>

              <div className="mt-2">
                <label className="block mb-1">Harga Minimum</label>
                <input
                  type="text"
                  {...register('minimumPrice', {
                    min: 0,
                    onChange: (e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      if (value) {
                        const number = parseInt(value, 10);
                        e.target.value = formatCurrency(number);
                      }
                    },
                  })}
                  className="border p-2 w-full"
                  placeholder="Masukkan harga minimum"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError(null);
                    reset({
                      name: '',
                      goldContent: undefined,
                      minimumPrice: undefined,
                    });
                  }}
                  variant="outline"
                  className="mr-2"
                >
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCategory(null);
            setError(null);
            reset({
              minimumPrice: undefined,
            });
          }}
        >
          <div className="max-w-3xl">
            <form onSubmit={handleSubmit(handleEdit)} className="p-4">
              <h2 className="text-lg font-bold mb-4">Edit Harga Minimum Kategori</h2>
              {error && <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

              <div className="mt-2">
                <label className="block mb-1">Harga Minimum</label>
                <input
                  type="text"
                  {...register('minimumPrice', {
                    min: 0,
                    onChange: (e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      if (value) {
                        const number = parseInt(value, 10);
                        e.target.value = formatCurrency(number);
                      }
                    },
                  })}
                  className="border p-2 w-full"
                  placeholder="Masukkan harga minimum"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedCategory(null);
                    setError(null);
                    reset({
                      minimumPrice: undefined,
                    });
                  }}
                  variant="outline"
                  className="mr-2"
                >
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
