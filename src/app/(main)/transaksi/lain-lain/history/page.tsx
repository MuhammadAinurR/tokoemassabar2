"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableTableHead,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Printer } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
}

interface PrintSummary {
  transactions: Transaction[];
  summary: {
    totalAmount: number;
    count: number;
    startDate: string;
    endDate: string;
    type: string;
  };
}

const HistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewType, setViewType] = useState<"income" | "expense">("income");
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Print dialog states
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printStartDate, setPrintStartDate] = useState<Date | null>(null);
  const [printEndDate, setPrintEndDate] = useState<Date | null>(null);
  const [printData, setPrintData] = useState<PrintSummary | null>(null);
  const [isLoadingPrint, setIsLoadingPrint] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const start = startDate ? startDate.toISOString() : "";
        const end = endDate
          ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString()
          : "";
        const response = await fetch(
          `/api/additional-transaction?type=${viewType}&page=${page}&start=${start}&end=${end}`
        );
        const data = await response.json();
        const formattedData = data.map((t: Transaction) => ({
          ...t,
          amount:
            typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
        }));
        setTransactions(formattedData.reverse());
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, [viewType, page, startDate, endDate]);

  const handlePrintPreview = async () => {
    if (!printStartDate || !printEndDate) {
      alert("Silakan pilih tanggal mulai dan tanggal akhir");
      return;
    }

    setIsLoadingPrint(true);
    try {
      const start = printStartDate.toISOString();
      const end = new Date(
        printEndDate.setHours(23, 59, 59, 999)
      ).toISOString();
      const response = await fetch(
        `/api/additional-transaction/print-summary?type=${viewType}&start=${start}&end=${end}`
      );
      const data = await response.json();
      setPrintData(data);
    } catch (error) {
      console.error("Error fetching print data:", error);
      alert("Gagal mengambil data untuk cetak");
    } finally {
      setIsLoadingPrint(false);
    }
  };

  const handlePrint = () => {
    if (!printData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan ${
            viewType === "income" ? "Pemasukan" : "Pengeluaran"
          }</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .summary {
              background-color: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .summary h3 {
              margin: 0 0 15px 0;
              color: #333;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #ddd;
            }
            .summary-item:last-child {
              border-bottom: none;
              font-weight: bold;
              font-size: 1.1em;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .print-date {
              text-align: right;
              margin-top: 30px;
              font-size: 0.9em;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Transaksi ${
              viewType === "income" ? "Pemasukan" : "Pengeluaran"
            } Lain-Lain</h1>
            <p>Periode: ${format(
              new Date(printData.summary.startDate),
              "dd/MM/yyyy"
            )} - ${format(
      new Date(printData.summary.endDate),
      "dd/MM/yyyy"
    )}</p>
          </div>
          
          <div class="summary">
            <h3>Ringkasan</h3>
            <div class="summary-item">
              <span>Periode:</span>
              <span>${format(
                new Date(printData.summary.startDate),
                "dd MMMM yyyy"
              )} - ${format(
      new Date(printData.summary.endDate),
      "dd MMMM yyyy"
    )}</span>
            </div>
            <div class="summary-item">
              <span>Jumlah Transaksi:</span>
              <span>${printData.summary.count} transaksi</span>
            </div>
            <div class="summary-item">
              <span>Total Nominal:</span>
              <span>Rp. ${printData.summary.totalAmount.toLocaleString(
                "id-ID",
                { minimumFractionDigits: 0, maximumFractionDigits: 0 }
              )}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Deskripsi</th>
                <th>Nominal</th>
                <th>Tanggal</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              ${printData.transactions
                .map(
                  (transaction, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${transaction.description}</td>
                  <td>Rp. ${transaction.amount.toLocaleString("id-ID", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</td>
                  <td>${new Date(transaction.createdAt).toLocaleDateString(
                    "id-ID",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}</td>
                  <td>${new Date(transaction.createdAt).toLocaleTimeString(
                    "id-ID",
                    { hour: "2-digit", minute: "2-digit" }
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="print-date">
            Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">
            Riwayat Transaksi Lain-Lain
          </h1>

          <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Cetak Laporan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Cetak Laporan{" "}
                  {viewType === "income" ? "Pemasukan" : "Pengeluaran"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Date Selection */}
                <div className="flex items-center gap-4 justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Dari:
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[150px] h-9 justify-start text-left text-sm font-normal",
                            !printStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {printStartDate ? (
                            format(printStartDate, "dd/MM/yyyy")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={printStartDate || undefined}
                          onSelect={(date: Date | undefined) =>
                            setPrintStartDate(date || null)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Sampai:
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[150px] h-9 justify-start text-left text-sm font-normal",
                            !printEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {printEndDate ? (
                            format(printEndDate, "dd/MM/yyyy")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={printEndDate || undefined}
                          onSelect={(date: Date | undefined) =>
                            setPrintEndDate(date || null)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    onClick={handlePrintPreview}
                    disabled={
                      !printStartDate || !printEndDate || isLoadingPrint
                    }
                    className="h-9"
                  >
                    {isLoadingPrint ? "Loading..." : "Tampilkan"}
                  </Button>
                </div>

                {/* Print Preview */}
                {printData && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Ringkasan</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">
                            Periode:
                          </span>
                          <p className="font-medium">
                            {format(
                              new Date(printData.summary.startDate),
                              "dd MMMM yyyy"
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(printData.summary.endDate),
                              "dd MMMM yyyy"
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">
                            Jumlah Transaksi:
                          </span>
                          <p className="font-medium">
                            {printData.summary.count} transaksi
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-gray-600">
                            Total Nominal:
                          </span>
                          <p className="text-xl font-bold text-green-600">
                            Rp.{" "}
                            {printData.summary.totalAmount.toLocaleString(
                              "id-ID",
                              {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-lg shadow-sm border max-h-96 overflow-y-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <SortableTableHead className="text-sm font-medium">
                              No
                            </SortableTableHead>
                            <SortableTableHead className="text-sm font-medium">
                              Deskripsi
                            </SortableTableHead>
                            <SortableTableHead className="text-sm font-medium">
                              Nominal
                            </SortableTableHead>
                            <SortableTableHead className="text-sm font-medium">
                              Tanggal
                            </SortableTableHead>
                            <SortableTableHead className="text-sm font-medium">
                              Waktu
                            </SortableTableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {printData.transactions.length > 0 ? (
                            printData.transactions.map((transaction, index) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="text-sm">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {transaction.description}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  Rp.{" "}
                                  {transaction.amount.toLocaleString("id-ID", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {new Date(
                                    transaction.createdAt
                                  ).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {new Date(
                                    transaction.createdAt
                                  ).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-6 text-sm text-gray-500"
                              >
                                Tidak ada data tersedia
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Print Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handlePrint}
                        className="flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Cetak
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap items-center gap-4 justify-end">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">From:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[150px] h-9 justify-start text-left text-sm font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "dd/MM/yyyy")
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate || undefined}
                    onSelect={(date: Date | undefined) =>
                      setStartDate(date || null)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">To:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[150px] h-9 justify-start text-left text-sm font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "dd/MM/yyyy")
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate || undefined}
                    onSelect={(date: Date | undefined) =>
                      setEndDate(date || null)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewType("income")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewType === "income"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setViewType("expense")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewType === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pengeluaran
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <SortableTableHead className="text-sm font-medium">
                Deskripsi
              </SortableTableHead>
              <SortableTableHead className="text-sm font-medium">
                Nominal
              </SortableTableHead>
              <SortableTableHead className="text-sm font-medium">
                Tanggal
              </SortableTableHead>
              <SortableTableHead className="text-sm font-medium">
                Waktu
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    Rp.{" "}
                    {transaction.amount.toLocaleString("id-ID", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(transaction.createdAt).toLocaleDateString(
                      "id-ID",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(transaction.createdAt).toLocaleTimeString(
                      "id-ID",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 text-sm text-gray-500"
                >
                  Tidak ada data tersedia
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between mt-4">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="text-sm h-9 px-4"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          onClick={() => setPage((prev) => prev + 1)}
          className="text-sm h-9 px-4"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default HistoryPage;
