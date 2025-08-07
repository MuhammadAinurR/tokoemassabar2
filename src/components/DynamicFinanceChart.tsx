// Suppress recharts warnings about defaultProps
const error = console.error;
console.error = (...args: any) => {
  if (args[0].includes("defaultProps")) return;
  error(...args);
};

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface FinanceData {
  id: string;
  date: string;
  incomingMoney: string | number;
  outgoingMoney: string | number;
  totalIncome: string | number;
  totalExpense: string | number;
  closingBalance: string | number;
}

interface Props {
  data: FinanceData[];
}

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatYAxis = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}Jt`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}rb`;
  }
  return value.toString();
};

const DynamicFinanceChart = ({ data }: Props) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[400px] text-gray-500">Tidak ada data keuangan</div>;
  }

  const formattedData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item) => ({
      date: format(new Date(item.date), "dd/MM", { locale: id }),
      "Uang Masuk": Number(item.incomingMoney),
      "Uang Keluar": Number(item.outgoingMoney),
      "Total Pemasukan": Number(item.totalIncome),
      "Total Pengeluaran": Number(item.totalExpense),
      "Saldo Akhir": Number(item.closingBalance),
    }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={formattedData} margin={{ left: 15, right: 15, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          height={60}
          tick={{ dy: 10 }}
          tickLine={true}
          axisLine={true}
          scale="point"
          padding={{ left: 10, right: 10 }}
          allowDecimals={true}
          allowDataOverflow={false}
          allowDuplicatedCategory={true}
          hide={false}
          mirror={false}
          orientation="bottom"
          reversed={false}
          tickCount={5}
          type="category"
          xAxisId={0}
        />
        <YAxis
          width={70}
          tickFormatter={formatYAxis}
          allowDecimals={false}
          scale="linear"
          domain={["auto", "auto"]}
          padding={{ top: 20, bottom: 20 }}
        />
        <Tooltip formatter={(value: number) => formatIDR(value)} labelFormatter={(label) => `Tanggal: ${label}`} />
        <Legend />
        <Line type="linear" dataKey="Uang Masuk" stroke="#22c55e" />
        <Line type="linear" dataKey="Uang Keluar" stroke="#ef4444" />
        <Line type="linear" dataKey="Total Pemasukan" stroke="#3b82f6" />
        <Line type="linear" dataKey="Total Pengeluaran" stroke="#f97316" />
        <Line type="linear" dataKey="Saldo Akhir" stroke="#8b5cf6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DynamicFinanceChart;
