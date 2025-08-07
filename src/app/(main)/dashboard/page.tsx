'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DynamicBarChart = dynamic(() => import('@/components/DynamicBarChart'), {
  ssr: false,
});

const DynamicFinanceChart = dynamic(() => import('@/components/DynamicFinanceChart'), {
  ssr: false,
});

const salesData = [
  { day: 'Sen', sales: 1200 },
  { day: 'Sel', sales: 1800 },
  { day: 'Rab', sales: 2200 },
  { day: 'Kam', sales: 1600 },
  { day: 'Jum', sales: 2400 },
  { day: 'Sab', sales: 3000 },
  { day: 'Min', sales: 2800 },
];

const topSellingItems = [
  { name: 'Kalung Emas', sales: 42, revenue: 8400 },
  { name: 'Cincin Berlian', sales: 38, revenue: 19000 },
  { name: 'Gelang Perak', sales: 56, revenue: 5600 },
  { name: 'Anting Mutiara', sales: 31, revenue: 3100 },
  { name: 'Jam Tangan Emas', sales: 25, revenue: 12500 },
];

interface CategorySummary {
  id: string;
  name: string;
  itemCount: number;
  totalWeight: string;
  totalBerat24K?: number;
  goldContent?: string;
}

const DashboardPage = () => {
  const [financeData, setFinanceData] = React.useState([]);
  const [monthlyFinanceData, setMonthlyFinanceData] = React.useState([]);
  const [monthlyOperasionalData, setMonthlyOperasionalData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [weeklyTotals, setWeeklyTotals] = React.useState({
    incomingItems: 0,
    outgoingItems: 0,
    incomingMoney: 0,
    outgoingMoney: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
  const [categories, setCategories] = React.useState<CategorySummary[]>([]);
  const [dailySalesData, setDailySalesData] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<{
    [key: string]: { count: number; totalWeight: number; totalSales: number };
  }>({});
  const [totalBerat24K, setTotalBerat24K] = React.useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRangeData, setDateRangeData] = React.useState({
    financeData: [],
    operationalData: [],
  });
  const [startDateRange, setStartDateRange] = useState<Date | null>(null);
  const [endDateRange, setEndDateRange] = useState<Date | null>(null);

  React.useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        // Get current date and date 6 days ago (to get 7 days total including today)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);

        // Add the date range to the query params
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          all: 'true', // Get all data within range without pagination
        });

        const response = await fetch(`/api/finance?${params}`);
        const { data } = await response.json();
        setFinanceData(data);

        // Calculate weekly totals
        const totals = data.reduce(
          (
            acc: {
              incomingItems: number;
              outgoingItems: number;
              incomingMoney: number;
              outgoingMoney: number;
              totalIncome: number;
              totalExpense: number;
            },
            curr: {
              incomingItems: string | number;
              outgoingItems: string | number;
              incomingMoney: string | number;
              outgoingMoney: string | number;
              totalIncome: string | number;
              totalExpense: string | number;
            }
          ) => ({
            incomingItems: acc.incomingItems + Number(curr.incomingItems),
            outgoingItems: acc.outgoingItems + Number(curr.outgoingItems),
            incomingMoney: acc.incomingMoney + Number(curr.incomingMoney),
            outgoingMoney: acc.outgoingMoney + Number(curr.outgoingMoney),
            totalIncome: acc.totalIncome + Number(curr.totalIncome),
            totalExpense: acc.totalExpense + Number(curr.totalExpense),
          }),
          { incomingItems: 0, outgoingItems: 0, incomingMoney: 0, outgoingMoney: 0, totalIncome: 0, totalExpense: 0 }
        );

        setWeeklyTotals(totals);
      } catch (error) {
        console.error('Failed to fetch finance data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMonthlyFinanceData = async () => {
      try {
        const params = new URLSearchParams({
          month: selectedMonth.toString(),
          year: selectedYear.toString(),
        });

        const response = await fetch(`/api/finance?${params}`);
        const { monthlyData, monthlyOperasional } = await response.json();
        setMonthlyFinanceData(monthlyData);
        setMonthlyOperasionalData(monthlyOperasional || []);
      } catch (error) {
        console.error('Failed to fetch monthly finance data:', error);
      }
    };

    const fetchCategoryData = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);

        // Calculate total Berat 24K after fetching categories
        const total = data.reduce((acc: number, category: CategorySummary) => {
          let berat24K = 0;
          const weight = parseFloat(category.totalWeight); // Convert totalWeight to a number

          // Assuming goldContent is available in the category data
          if (category.goldContent) {
            if (category.goldContent.toString().includes('15K')) {
              berat24K = weight * 0.72;
            } else if (category.goldContent.toString().includes('16K')) {
              berat24K = weight * 0.77;
            } else if (category.goldContent.toString().includes('17K')) {
              berat24K = weight * 0.85;
            }
          }

          return acc + berat24K; // Sum calculated Berat 24K
        }, 0);

        setTotalBerat24K(total); // Store total Berat 24K in state
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    const fetchDailySalesData = async () => {
      try {
        const today = new Date();

        const startDate = new Date(today.setHours(0, 0, 0, 0));
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const response = await fetch(`/api/sales?limit=50000&${params}`);
        const { data } = await response.json();
        setDailySalesData(data);
        calculateSummary(data);
      } catch (error) {
        console.error('Failed to fetch daily sales data:', error);
      }
    };

    const calculateSummary = (salesData: any[]) => {
      const summaryData = salesData.reduce((acc: any, item: any) => {
        const categoryName = item.category.name;
        const weight = parseFloat(item.grocery.weight);
        const sellPrice = parseFloat(item.sellPrice);

        if (!acc[categoryName]) {
          acc[categoryName] = {
            count: 0,
            totalWeight: 0,
            totalSales: 0,
          };
        }

        acc[categoryName].count += 1;
        acc[categoryName].totalWeight += weight;
        acc[categoryName].totalSales += sellPrice;

        return acc;
      }, {});

      setSummary(summaryData);
    };

    fetchFinanceData();
    fetchCategoryData();
    fetchDailySalesData();
    fetchMonthlyFinanceData();
  }, [selectedMonth, selectedYear]);

  // Separate useEffect for date range changes
  React.useEffect(() => {
    const fetchDateRangeData = async () => {
      if (!startDateRange || !endDateRange) return;

      try {
        const params = new URLSearchParams({
          startDate: startDateRange.toISOString(),
          endDate: endDateRange.toISOString(),
        });

        const response = await fetch(`/api/date-range-summary?${params}`);
        const data = await response.json();
        setDateRangeData(data);
      } catch (error) {
        console.error('Failed to fetch date range data:', error);
      }
    };

    fetchDateRangeData();
  }, [startDateRange, endDateRange]);

  const getCategorySummary = (categories: CategorySummary[] | null) => {
    if (!categories || !Array.isArray(categories)) return {};
    return categories.reduce((acc: { [key: string]: { itemCount: number; totalWeight: number } }, curr) => {
      if (!curr || !curr.name) return acc;

      if (!acc[curr.name]) {
        acc[curr.name] = {
          itemCount: 0,
          totalWeight: 0,
        };
      }
      acc[curr.name].itemCount += curr.itemCount || 0;
      acc[curr.name].totalWeight += parseFloat(curr.totalWeight || '0');
      return acc;
    }, {});
  };

  const getDateRange = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    };

    return `(${formatDate(sevenDaysAgo)} - ${formatDate(today)})`;
  };

  const getTotalWeight = (categories: CategorySummary[] | null) => {
    if (!categories || !Array.isArray(categories)) return 0;
    return Object.values(getCategorySummary(categories)).reduce((total, data) => {
      return total + (data.totalWeight || 0);
    }, 0);
  };

  const getTotalItems = (categories: CategorySummary[] | null) => {
    if (!categories || !Array.isArray(categories)) return 0;
    return Object.values(getCategorySummary(categories)).reduce((total, data) => {
      return total + (data.itemCount || 0);
    }, 0);
  };

  const getLatestStoreBalance = (data: any[] | null) => {
    if (!data || !Array.isArray(data) || data.length === 0) return 0;
    return parseFloat(data[0].storeClosingBalance) || 0;
  };

  const getTodaysSales = (data: any[] | null) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { items: 0, money: 0 };
    }
    const today = data[0];
    const todayDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const dataDate = new Date(today.date).toISOString().split('T')[0]; // Get the date from the data

    if (dataDate !== todayDate) {
      return { items: 0, money: 0 }; // Return 0 if the dates do not match
    }

    return {
      items: parseFloat(today.outgoingItems || 0),
      money: parseFloat(today.incomingMoney || 0),
    };
  };

  const formatMoney = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatWeight = (weight: number | null | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(weight || 0);
  };

  const getWeeklyTotals = (data: any[] | null) => {
    if (!data || !Array.isArray(data)) {
      return {
        incomingItems: 0,
        outgoingItems: 0,
        incomingMoney: 0,
        outgoingMoney: 0,
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    return data.reduce(
      (totals, item) => ({
        incomingItems: totals.incomingItems + parseFloat(item.incomingItems || 0),
        outgoingItems: totals.outgoingItems + parseFloat(item.outgoingItems || 0),
        incomingMoney: totals.incomingMoney + parseFloat(item.incomingMoney || 0),
        outgoingMoney: totals.outgoingMoney + parseFloat(item.outgoingMoney || 0),
        totalIncome: totals.totalIncome + parseFloat(item.totalIncome || 0),
        totalExpense: totals.totalExpense + parseFloat(item.totalExpense || 0),
      }),
      {
        incomingItems: 0,
        outgoingItems: 0,
        incomingMoney: 0,
        outgoingMoney: 0,
        totalIncome: 0,
        totalExpense: 0,
      }
    );
  };

  const totalSummary = Object.values(summary).reduce(
    (acc, { count, totalWeight, totalSales }) => {
      acc.totalCount += count;
      acc.totalWeight += totalWeight;
      acc.totalSales += totalSales;
      return acc;
    },
    { totalCount: 0, totalWeight: 0, totalSales: 0 }
  );

  const getMonthlyTotals = (data: any[] | null) => {
    if (!data || !Array.isArray(data)) {
      return {
        incomingItems: 0,
        outgoingItems: 0,
        incomingMoney: 0,
        outgoingMoney: 0,
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    return data.reduce(
      (totals, item) => ({
        incomingItems: totals.incomingItems + parseFloat(item.incomingItems || 0),
        outgoingItems: totals.outgoingItems + parseFloat(item.outgoingItems || 0),
        incomingMoney: totals.incomingMoney + parseFloat(item.incomingMoney || 0),
        outgoingMoney: totals.outgoingMoney + parseFloat(item.outgoingMoney || 0),
        totalIncome: totals.totalIncome + parseFloat(item.totalIncome || 0),
        totalExpense: totals.totalExpense + parseFloat(item.totalExpense || 0),
      }),
      {
        incomingItems: 0,
        outgoingItems: 0,
        incomingMoney: 0,
        outgoingMoney: 0,
        totalIncome: 0,
        totalExpense: 0,
      }
    );
  };

  const getTotalOperasionalCosts = (data: any[] | null) => {
    if (!data || !Array.isArray(data)) return 0;
    return data.reduce((total, item) => {
      return total + parseFloat(item.amount || 0);
    }, 0);
  };

  const getDateRangeTotals = (data: any[] | null) => {
    if (!data || !Array.isArray(data)) {
      return {
        incomingItems: 0,
        outgoingItems: 0,
        incomingMoney: 0,
        outgoingMoney: 0,
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    return data.reduce(
      (totals, item) => ({
        incomingItems: totals.incomingItems + parseFloat(item.incomingItems || 0),
        outgoingItems: totals.outgoingItems + parseFloat(item.outgoingItems || 0),
        incomingMoney: totals.incomingMoney + parseFloat(item.incomingMoney || 0),
        outgoingMoney: totals.outgoingMoney + parseFloat(item.outgoingMoney || 0),
        totalIncome: totals.totalIncome + parseFloat(item.totalIncome || 0),
        totalExpense: totals.totalExpense + parseFloat(item.totalExpense || 0),
      }),
      {
        incomingItems: 0,
        outgoingItems: 0,
        incomingMoney: 0,
        outgoingMoney: 0,
        totalIncome: 0,
        totalExpense: 0,
      }
    );
  };

  const getDateRangeLabel = () => {
    if (!startDateRange || !endDateRange) return 'Pilih Tanggal';
    return `${format(startDateRange, 'dd/MM/yyyy')} - ${format(endDateRange, 'dd/MM/yyyy')}`;
  };

  const getMonthRange = () => {
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return `${monthNames[selectedMonth]} ${selectedYear}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? 'Loading...' : `${formatMoney(getTotalItems(categories))} items`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Berat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? 'Loading...' : `${formatWeight(getTotalWeight(categories))} gram`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Berat (24K)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? 'Loading...' : `${formatWeight(totalBerat24K)} gram`}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kas Toko Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? 'Loading...' : `Rp ${formatMoney(getLatestStoreBalance(financeData))}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">Rp {formatMoney(getTodaysSales(financeData).money)}</div>
                <div className="text-sm text-muted-foreground">{formatWeight(getTodaysSales(financeData).items)}g</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Ikhtisar Keuangan Mingguan {getDateRange()}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">Loading...</div>
            ) : (
              <DynamicFinanceChart data={financeData} />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Arus Uang Minggu Ini {getDateRange()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Uang Masuk</p>
                  <p className="text-sm text-muted-foreground">7 hari terakhir</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `Rp ${formatMoney(weeklyTotals.incomingMoney)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Uang Keluar</p>
                  <p className="text-sm text-muted-foreground">7 hari terakhir</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `Rp ${formatMoney(weeklyTotals.outgoingMoney)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Pemasukan</p>
                  <p className="text-sm text-muted-foreground">7 hari terakhir</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `Rp ${formatMoney(weeklyTotals.totalIncome)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Pengeluaran</p>
                  <p className="text-sm text-muted-foreground">7 hari terakhir</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `Rp ${formatMoney(weeklyTotals.totalExpense)}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Barang Masuk dan Keluar Minggu Ini {getDateRange()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {loading ? (
                <div>Loading...</div>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Total Barang Masuk</p>
                      <p className="text-sm text-muted-foreground">7 hari terakhir</p>
                    </div>
                    <div className="ml-auto font-medium">
                      {`${formatWeight(getWeeklyTotals(financeData).incomingItems)}g`}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Total Barang Keluar</p>
                      <p className="text-sm text-muted-foreground">7 hari terakhir</p>
                    </div>
                    <div className="ml-auto font-medium">
                      {`${formatWeight(getWeeklyTotals(financeData).outgoingItems)}g`}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Jumlah Keseluruhan Barang</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : !categories || categories.length === 0 ? (
              <div>Tidak ada data kategori</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(getCategorySummary(categories)).map(([name, data]) => (
                  <div
                    key={name}
                    className="flex items-start space-x-4 p-4 rounded-lg border bg-card text-card-foreground"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {name === 'Kalung'
                          ? 'KL'
                          : name === 'Giwang'
                          ? 'GW'
                          : name === 'Anting'
                          ? 'AT'
                          : name === 'Gelang'
                          ? 'GL'
                          : name === 'Cincin'
                          ? 'CN'
                          : name === 'Liontin'
                          ? 'LT'
                          : name.substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <h3 className="font-semibold">{name}</h3>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">Jumlah</span>
                          <span className="text-lg font-semibold">{formatMoney(data.itemCount)} pcs</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">Berat</span>
                          <span className="text-lg font-semibold">{formatWeight(data.totalWeight)}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Summary Table */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ringkasan Penjualan Hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="summary-table mx-auto border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Kategori</th>
                  <th className="border border-gray-300 px-4 py-2">Jumlah Barang</th>
                  <th className="border border-gray-300 px-4 py-2">Jumlah Berat</th>
                  <th className="border border-gray-300 px-4 py-2">Jumlah Uang</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-2">
                      Belum ada data penjualan hari ini
                    </td>
                  </tr>
                ) : (
                  Object.entries(summary).map(([category, { count, totalWeight, totalSales }]) => (
                    <tr key={category}>
                      <td className="border border-gray-300 px-4 py-2">{category}</td>
                      <td className="border border-gray-300 px-4 py-2">{count}</td>
                      <td className="border border-gray-300 px-4 py-2">{totalWeight.toFixed(3)} g</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">Rp {totalSales.toLocaleString()}</td>
                    </tr>
                  ))
                )}
                <tr style={{ fontWeight: 'bold' }}>
                  <td className="border border-gray-300 px-4 py-2">Total</td>
                  <td className="border border-gray-300 px-4 py-2">{totalSummary.totalCount}</td>
                  <td className="border border-gray-300 px-4 py-2">{totalSummary.totalWeight.toFixed(3)} g</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    Rp {totalSummary.totalSales.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Ringkasan penjualan bulanan */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ringkasan Bulanan</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Januari</SelectItem>
                    <SelectItem value="1">Februari</SelectItem>
                    <SelectItem value="2">Maret</SelectItem>
                    <SelectItem value="3">April</SelectItem>
                    <SelectItem value="4">Mei</SelectItem>
                    <SelectItem value="5">Juni</SelectItem>
                    <SelectItem value="6">Juli</SelectItem>
                    <SelectItem value="7">Agustus</SelectItem>
                    <SelectItem value="8">September</SelectItem>
                    <SelectItem value="9">Oktober</SelectItem>
                    <SelectItem value="10">November</SelectItem>
                    <SelectItem value="11">Desember</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Uang Masuk</p>
                  <p className="text-sm text-muted-foreground">{getMonthRange()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `Rp ${formatMoney(getMonthlyTotals(monthlyFinanceData).incomingMoney)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Uang Keluar</p>
                  <p className="text-sm text-muted-foreground">{getMonthRange()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `Rp ${formatMoney(getMonthlyTotals(monthlyFinanceData).outgoingMoney)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Pemasukan</p>
                  <p className="text-sm text-muted-foreground">{getMonthRange()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `Rp ${formatMoney(getMonthlyTotals(monthlyFinanceData).totalIncome)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Pengeluaran</p>
                  <p className="text-sm text-muted-foreground">{getMonthRange()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading
                    ? 'Loading...'
                    : `Rp ${formatMoney(
                        getMonthlyTotals(monthlyFinanceData).totalExpense -
                          getTotalOperasionalCosts(monthlyOperasionalData)
                      )}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Biaya Operasional</p>
                  <p className="text-sm text-muted-foreground">{getMonthRange()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `Rp ${formatMoney(getTotalOperasionalCosts(monthlyOperasionalData))}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Barang Masuk</p>
                  <p className="text-sm text-muted-foreground">{getMonthRange()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `${formatWeight(getMonthlyTotals(monthlyFinanceData).incomingItems)}g`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Barang Keluar</p>
                  <p className="text-sm text-muted-foreground">{getMonthRange()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {loading ? 'Loading...' : `${formatWeight(getMonthlyTotals(monthlyFinanceData).outgoingItems)}g`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Range Summary */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ringkasan Periode</CardTitle>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[150px] justify-start text-left font-normal',
                        !startDateRange && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateRange ? format(startDateRange, 'dd/MM/yyyy') : 'Tanggal Mulai'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDateRange || undefined}
                      onSelect={(date: Date | undefined) => setStartDateRange(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[150px] justify-start text-left font-normal',
                        !endDateRange && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDateRange ? format(endDateRange, 'dd/MM/yyyy') : 'Tanggal Akhir'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDateRange || undefined}
                      onSelect={(date: Date | undefined) => setEndDateRange(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Uang Masuk</p>
                  <p className="text-sm text-muted-foreground">{getDateRangeLabel()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {!startDateRange || !endDateRange
                    ? 'Pilih tanggal'
                    : `Rp ${formatMoney(getDateRangeTotals(dateRangeData.financeData).incomingMoney)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Uang Keluar</p>
                  <p className="text-sm text-muted-foreground">{getDateRangeLabel()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {!startDateRange || !endDateRange
                    ? 'Pilih tanggal'
                    : `Rp ${formatMoney(getDateRangeTotals(dateRangeData.financeData).outgoingMoney)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Pemasukan</p>
                  <p className="text-sm text-muted-foreground">{getDateRangeLabel()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {!startDateRange || !endDateRange
                    ? 'Pilih tanggal'
                    : `Rp ${formatMoney(getDateRangeTotals(dateRangeData.financeData).totalIncome)}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Pengeluaran</p>
                  <p className="text-sm text-muted-foreground">{getDateRangeLabel()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {!startDateRange || !endDateRange
                    ? 'Pilih tanggal'
                    : `Rp ${formatMoney(
                        getDateRangeTotals(dateRangeData.financeData).totalExpense -
                          getTotalOperasionalCosts(dateRangeData.operationalData)
                      )}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Biaya Operasional</p>
                  <p className="text-sm text-muted-foreground">{getDateRangeLabel()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {!startDateRange || !endDateRange
                    ? 'Pilih tanggal'
                    : `Rp ${formatMoney(getTotalOperasionalCosts(dateRangeData.operationalData))}`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Barang Masuk</p>
                  <p className="text-sm text-muted-foreground">{getDateRangeLabel()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {!startDateRange || !endDateRange
                    ? 'Pilih tanggal'
                    : `${formatWeight(getDateRangeTotals(dateRangeData.financeData).incomingItems)}g`}
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Barang Keluar</p>
                  <p className="text-sm text-muted-foreground">{getDateRangeLabel()}</p>
                </div>
                <div className="ml-auto font-medium">
                  {!startDateRange || !endDateRange
                    ? 'Pilih tanggal'
                    : `${formatWeight(getDateRangeTotals(dateRangeData.financeData).outgoingItems)}g`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
