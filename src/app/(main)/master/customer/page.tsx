'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow, SortableTableHead } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { showToast } from '@/lib/showToast';

interface Customer {
  id: string;
  name: string;
  idNumber: string;
  address: string;
  phoneNumber: string;
}

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-t">
    <div className="text-sm text-gray-700">
      Halaman {currentPage} dari {totalPages}
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </Button>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </Button>
    </div>
  </div>
);

const AddressDialog = ({ isOpen, onClose, address }: { isOpen: boolean; onClose: () => void; address: string }) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Detail Alamat</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{address}</p>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </Modal>
  );
};

const EditCustomerDialog = ({
  isOpen,
  onClose,
  customer,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSubmit: (data: Customer) => void;
}) => {
  const { register, handleSubmit, reset } = useForm<Customer>({
    defaultValues: customer || undefined,
  });

  useEffect(() => {
    if (customer) {
      reset(customer);
    }
  }, [customer, reset]);

  if (!isOpen || !customer) return null;

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        <h2 className="text-lg font-bold mb-4">Edit Customer</h2>
        <div>
          <label className="block mb-1">Nama</label>
          <input {...register('name', { required: true })} className="border p-2 w-full rounded-md" />
        </div>
        <div className="mt-2">
          <label className="block mb-1">Nomor KTP</label>
          <input {...register('idNumber', { required: true })} className="border p-2 w-full rounded-md" />
        </div>
        <div className="mt-2">
          <label className="block mb-1">Alamat</label>
          <textarea {...register('address', { required: true })} className="border p-2 w-full rounded-md" rows={3} />
        </div>
        <div className="mt-2">
          <label className="block mb-1">Telepon</label>
          <input {...register('phoneNumber', { required: true })} className="border p-2 w-full rounded-md" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
};

const CreateCustomerDialog = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Customer, 'id'>) => void;
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Omit<Customer, 'id'>>();

  useEffect(() => {
    if (isOpen) {
      reset(); // Reset form when dialog opens
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        <h2 className="text-lg font-bold mb-4">Tambah Customer Baru</h2>
        <div>
          <label className="block mb-1">Nama</label>
          <input
            {...register('name', {
              required: 'Nama harus diisi',
            })}
            className="border p-2 w-full rounded-md"
          />
          {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
        </div>
        <div className="mt-2">
          <label className="block mb-1">Nomor KTP</label>
          <input
            {...register('idNumber', {
              pattern: {
                value: /^\d+$/,
                message: 'Nomor KTP harus berupa angka',
              },
            })}
            className="border p-2 w-full rounded-md"
          />
          {errors.idNumber && <span className="text-red-500 text-sm">{errors.idNumber.message}</span>}
        </div>
        <div className="mt-2">
          <label className="block mb-1">Alamat</label>
          <textarea
            {...register('address', {
              required: 'Alamat harus diisi',
            })}
            className="border p-2 w-full rounded-md"
            rows={3}
          />
          {errors.address && <span className="text-red-500 text-sm">{errors.address.message}</span>}
        </div>
        <div className="mt-2">
          <label className="block mb-1">Telepon</label>
          <input
            {...register('phoneNumber', {
              pattern: {
                value: /^[0-9+-]+$/,
                message: 'Format nomor telepon tidak valid',
              },
            })}
            className="border p-2 w-full rounded-md"
          />
          {errors.phoneNumber && <span className="text-red-500 text-sm">{errors.phoneNumber.message}</span>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
};

const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Customer>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, sortKey, sortDirection]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/customers/table?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&sortBy=${sortKey}&sortOrder=${sortDirection}`
      );
      const result = await response.json();
      setCustomers(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
    setIsLoading(false);
  };

  const handleSort = (key: keyof Customer) => {
    setSortDirection((current) => (sortKey === key && current === 'asc' ? 'desc' : 'asc'));
    setSortKey(key);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleShowAddress = (address: string) => {
    setSelectedAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: Customer) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/customers/table/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      // Refresh the customer list
      await fetchCustomers();
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
    setIsLoading(false);
  };

  const handleCreateSubmit = async (data: Omit<Customer, 'id'>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers/table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        showToast('error', 'Gagal menambahkan data customer, KTP sudah terdaftar');
        throw new Error('Failed to create customer');
      }

      // Refresh the customer list
      await fetchCustomers();
      setIsCreateModalOpen(false);
      showToast('success', 'Data customer berhasil ditambahkan');
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header setIsCreateModalOpen={setIsCreateModalOpen} />
      <div className="mb-4">
        <Input
          placeholder="Cari nomor KTP atau nama customer..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
      </div>
      <CustomersTable
        customers={customers}
        isLoading={isLoading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        handleSort={handleSort}
        handleEdit={handleEdit}
        handleShowAddress={handleShowAddress}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        totalPages={totalPages}
      />

      <AddressDialog isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} address={selectedAddress} />

      <EditCustomerDialog
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSubmit={handleEditSubmit}
      />

      <CreateCustomerDialog
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsLoading(false);
        }}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
};

// New Components
const Header = ({ setIsCreateModalOpen }: { setIsCreateModalOpen: (open: boolean) => void }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold">Data Customer</h1>
    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gray-600 hover:bg-gray-800 text-white">
      Tambah Customer Baru
    </Button>
  </div>
);

const CustomersTable = ({
  customers,
  isLoading,
  sortKey,
  sortDirection,
  handleSort,
  handleEdit,
  handleShowAddress,
  currentPage,
  setCurrentPage,
  totalPages,
}: {
  customers: Customer[];
  isLoading: boolean;
  sortKey: keyof Customer;
  sortDirection: 'asc' | 'desc';
  handleSort: (key: keyof Customer) => void;
  handleEdit: (customer: Customer) => void;
  handleShowAddress: (address: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}) => {
  const tableKey = useMemo(() => 'customers-table', []);

  return (
    <div className="bg-white shadow-md rounded-lg">
      <Table key={tableKey}>
        <TableHeader>
          <TableRow>
            <SortableTableHead sorted={sortKey === 'name' ? sortDirection : null} onSort={() => handleSort('name')}>
              Nama
            </SortableTableHead>
            <SortableTableHead sorted={sortKey === 'idNumber' ? sortDirection : null} onSort={() => handleSort('idNumber')}>
              Nomor KTP
            </SortableTableHead>
            <SortableTableHead sorted={sortKey === 'phoneNumber' ? sortDirection : null} onSort={() => handleSort('phoneNumber')}>
              Telepon
            </SortableTableHead>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-32">
                Loading...
              </TableCell>
            </TableRow>
          ) : !customers || customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-32">
                Belum ada customer tercatat
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.idNumber}</TableCell>
                <TableCell>{customer.phoneNumber}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                      Ubah
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleShowAddress(customer.address)}>
                      Alamat
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
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
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

export default CustomerPage;
