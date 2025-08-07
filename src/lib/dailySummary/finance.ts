import { PrismaClient, Prisma } from '@prisma/client';
import { getToday } from '../getToday';
const prisma = new PrismaClient();

interface UpdateFinanceParams {
  amount: Prisma.Decimal;
  action: 'incomingMoney' | 'outgoingMoney' | 'incomingItems' | 'outgoingItems' | 'totalIncome' | 'totalExpense';
  tx?: Prisma.TransactionClient;
}

export const updateFinance = async ({ amount, action, tx = prisma }: UpdateFinanceParams) => {
  const today = getToday();

  const previousSummary = await tx.finance.findFirst({
    orderBy: { date: 'desc' },
    where: { date: { lt: today } },
  });

  const currentSummary = await tx.finance.findUnique({
    where: { date: today },
  });

  const dailyFinance = await prisma.finance.upsert({
    where: { date: today },
    create: {
      date: today,
      openingBalance: new Prisma.Decimal(previousSummary?.closingBalance ?? 0),
      [action]: amount,
      closingBalance: new Prisma.Decimal(previousSummary?.closingBalance ?? 0)
        .add(action === 'incomingMoney' ? amount : 0)
        .add(action === 'totalIncome' ? amount : 0)
        .sub(action === 'outgoingMoney' ? amount : 0)
        .sub(action === 'totalExpense' ? amount : 0),
    },
    update: {
      [action]: { increment: amount },
      closingBalance: {
        set: currentSummary 
          ? new Prisma.Decimal(currentSummary.openingBalance)
              .add(currentSummary.incomingMoney ?? 0)
              .add(currentSummary.totalIncome ?? 0)
              .sub(currentSummary.outgoingMoney ?? 0)
              .sub(currentSummary.totalExpense ?? 0)
              .add(action === 'incomingMoney' ? amount : 0)
              .add(action === 'totalIncome' ? amount : 0)
              .sub(action === 'outgoingMoney' ? amount : 0)
              .sub(action === 'totalExpense' ? amount : 0)
          : new Prisma.Decimal(previousSummary?.closingBalance ?? 0)
              .add(action === 'incomingMoney' ? amount : 0)
              .add(action === 'totalIncome' ? amount : 0)
              .sub(action === 'outgoingMoney' ? amount : 0)
              .sub(action === 'totalExpense' ? amount : 0),
      },
    },
  });

  return dailyFinance;
};

// Example usage:

// 1. Recording money received (Uang Masuk)
// await updateFinance({
//     amount: 5_000_000,
//     action: 'incomingMoney',
//     tx: prismaTransaction
//   })
// Effects:
// - incomingMoney: +5.000.000
// - closingBalance: recalculated with all components

// 2. Recording incoming inventory weight (Barang Masuk)
//   await updateFinance({
//     amount: 15.5,
//     action: 'incomingItems',
//     tx: prismaTransaction
//   })
// Effects:
// - incomingItems: +15.5
// - (no effect on closing balance)

// 3. Recording outgoing inventory weight (Barang Keluar)
//   await updateFinance({
//     amount: 8.2,
//     action: 'outgoingItems',
//     tx: prismaTransaction
//   })
// Effects:
// - outgoingItems: +8.2
// - (no effect on closing balance)

// 4. Recording money spent (Uang Keluar)
//   await updateFinance({
//     amount: 2_000_000,
//     action: 'outgoingMoney',
//     tx: prismaTransaction
//   })
// Effects:
// - outgoingMoney: +2.000.000
// - closingBalance: recalculated with all components

// 5. Recording total income (Pemasukan)
//   await updateFinance({
//     amount: 5_000_000,
//     action: 'totalIncome',
//     tx: prismaTransaction
//   })
// Effects:
// - totalIncome: +5.000.000
// - closingBalance: recalculated with all components

// 6. Recording total expense (Pengeluaran)
//   await updateFinance({
//     amount: 2_000_000,
//     action: 'totalExpense',
//     tx: prismaTransaction
//   })
// Effects:
// - totalExpense: +2.000.000
// - closingBalance: recalculated with all components
