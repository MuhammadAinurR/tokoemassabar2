"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  SortableTableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/lib/showToast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    customer: "",
    phoneNumber: "",
    address: "",
    jewelryName: "",
    weight: "",
    description: "",
    ongkos: "",
  });

  const fetchServices = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      search,
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && {
        endDate: endDate
          ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString()
          : undefined,
      }),
    });

    const response = await fetch(`/api/services?${params}`);
    const data = await response.json();
    setServices(data.services);
    setTotalPages(data.totalPages);
  };

  useEffect(() => {
    fetchServices();
  }, [page, search, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSubmit = {
        ...formData,
        ongkos: formData.ongkos ? formData.ongkos.replace(/\./g, "") : "",
      };

      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataToSubmit),
      });

      if (response.ok) {
        showToast("success", "Service data telah dibuat");
        setOpen(false);
        fetchServices();
        setFormData({
          customer: "",
          phoneNumber: "",
          address: "",
          jewelryName: "",
          weight: "",
          description: "",
          ongkos: "",
        });
      }
    } catch (error) {
      showToast("error", "Gagal membuat data service");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "PATCH",
      });

      if (response.ok) {
        showToast("success", "Service telah diselesaikan");
        fetchServices();
      }
    } catch (error) {
      showToast("error", "Gagal memperbarui data service");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Daftar Service</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Cari nama customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Tanggal Mulai"}
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Tanggal Akhir"}
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

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              className="h-8 px-2"
            >
              Reset
            </Button>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Tambah Service Baru</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Service Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label>Nama Customer</label>
                  <Input
                    value={formData.customer}
                    onChange={(e) =>
                      setFormData({ ...formData, customer: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label>Nomor Telepon</label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Alamat</label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Nama Perhiasan</label>
                  <Input
                    value={formData.jewelryName}
                    onChange={(e) =>
                      setFormData({ ...formData, jewelryName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Berat (gram)</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Deskripsi</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label>Ongkos Service</label>
                  <Input
                    type="text"
                    value={formData.ongkos}
                    onChange={(e) => {
                      const formattedValue = e.target.value.replace(/\D/g, "");
                      const formattedWithDots = new Intl.NumberFormat(
                        "id-ID"
                      ).format(Number(formattedValue));
                      setFormData({ ...formData, ongkos: formattedWithDots });
                    }}
                  />
                </div>
                <Button type="submit">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead>Nama Customer</SortableTableHead>
              <SortableTableHead>No. Telp</SortableTableHead>
              <SortableTableHead>Alamat</SortableTableHead>
              <SortableTableHead>Nama Perhiasan</SortableTableHead>
              <SortableTableHead>Berat</SortableTableHead>
              <SortableTableHead>Deskripsi</SortableTableHead>
              <SortableTableHead>Waktu Dibuat</SortableTableHead>
              <SortableTableHead>Waktu Selesai</SortableTableHead>
              <SortableTableHead>Ongkos</SortableTableHead>
              <SortableTableHead>Status</SortableTableHead>
              <SortableTableHead>Action</SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  Tidak ada data service
                </TableCell>
              </TableRow>
            ) : (
              services.map((service: any) => (
                <TableRow key={service.id}>
                  <TableCell>{service.customer}</TableCell>
                  <TableCell>{service.phoneNumber}</TableCell>
                  <TableCell>{service.address}</TableCell>
                  <TableCell>{service.jewelryName}</TableCell>
                  <TableCell>
                    {service.weight ? `${service.weight}g` : "-"}
                  </TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>
                    {new Date(service.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {service.doneAt
                      ? new Date(service.doneAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {service.ongkos
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(service.ongkos)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        service.isDone
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {service.isDone ? "Selesai" : "Dalam proses"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Detail
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detail Service</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="font-semibold">
                                Nama Customer:
                              </span>
                              <span>{service.customer}</span>

                              <span className="font-semibold">
                                Nomor Telepon:
                              </span>
                              <span>{service.phoneNumber || "-"}</span>

                              <span className="font-semibold">Alamat:</span>
                              <span>{service.address || "-"}</span>

                              <span className="font-semibold">
                                Nama Perhiasan:
                              </span>
                              <span>{service.jewelryName || "-"}</span>

                              <span className="font-semibold">Berat:</span>
                              <span>
                                {service.weight ? `${service.weight}g` : "-"}
                              </span>

                              <span className="font-semibold">Deskripsi:</span>
                              <span>{service.description}</span>

                              <span className="font-semibold">
                                Tanggal Dibuat:
                              </span>
                              <span>
                                {new Date(service.createdAt).toLocaleString()}
                              </span>

                              <span className="font-semibold">
                                Tanggal Selesai:
                              </span>
                              <span>
                                {service.doneAt
                                  ? new Date(service.doneAt).toLocaleString()
                                  : "-"}
                              </span>

                              <span className="font-semibold">
                                Ongkos Service:
                              </span>
                              <span>
                                {service.ongkos
                                  ? new Intl.NumberFormat("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                    }).format(service.ongkos)
                                  : "-"}
                              </span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {!service.isDone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComplete(service.id)}
                        >
                          Selesaikan Service
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
            Halaman {page} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
