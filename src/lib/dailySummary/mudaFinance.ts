import { PrismaClient, Prisma } from "@prisma/client";
import { getToday } from "../getToday";

interface UpdateMudaFinanceParams {
  amount: Prisma.Decimal;
  action:
    | "incomingMoney"
    | "outgoingMoney"
    | "incomingItems"
    | "outgoingItems"
    | "totalIncome"
    | "totalExpense";
  tx?: Prisma.TransactionClient;
}

// Since we don't have a separate MudaFinance table, we'll use the regular Finance table
// This ensures both emas_muda and emas_tua transactions are recorded in the same place
// for unified financial reporting
export const updateMudaFinance = async ({
  amount,
  action,
  tx,
}: UpdateMudaFinanceParams) => {
  const today = getToday();
  const prismaClient = tx || new PrismaClient();

  // Get previous and current summary for proper balance calculations
  const previousSummary = await prismaClient.finance.findFirst({
    orderBy: { date: "desc" },
    where: { date: { lt: today } },
  });

  const currentSummary = await prismaClient.finance.findUnique({
    where: { date: today },
  });

  try {
    const dailyFinance = await prismaClient.finance.upsert({
      where: { date: today },
      create: {
        date: today,
        openingBalance: new Prisma.Decimal(
          previousSummary?.closingBalance ?? 0
        ),
        outgoingItems:
          action === "outgoingItems" ? amount : new Prisma.Decimal(0),
        incomingMoney:
          action === "incomingMoney" ? amount : new Prisma.Decimal(0),
        incomingItems:
          action === "incomingItems" ? amount : new Prisma.Decimal(0),
        outgoingMoney:
          action === "outgoingMoney" ? amount : new Prisma.Decimal(0),
        totalIncome:
          action === "totalIncome" || action === "incomingMoney"
            ? amount
            : new Prisma.Decimal(0),
        totalExpense:
          action === "totalExpense" ? amount : new Prisma.Decimal(0),
        closingBalance: new Prisma.Decimal(previousSummary?.closingBalance ?? 0)
          .add(action === "incomingMoney" ? amount : 0)
          .add(action === "totalIncome" ? amount : 0)
          .sub(action === "outgoingMoney" ? amount : 0)
          .sub(action === "totalExpense" ? amount : 0),
      },
      update: {
        [action]: { increment: amount },
        ...(action === "incomingMoney" && {
          totalIncome: { increment: amount },
        }),
        closingBalance: {
          set: currentSummary
            ? new Prisma.Decimal(currentSummary.openingBalance)
                .add(currentSummary.incomingMoney ?? 0)
                .add(currentSummary.totalIncome ?? 0)
                .sub(currentSummary.outgoingMoney ?? 0)
                .sub(currentSummary.totalExpense ?? 0)
                .add(action === "incomingMoney" ? amount : 0)
                .add(action === "totalIncome" ? amount : 0)
                .sub(action === "outgoingMoney" ? amount : 0)
                .sub(action === "totalExpense" ? amount : 0)
            : new Prisma.Decimal(previousSummary?.closingBalance ?? 0)
                .add(action === "incomingMoney" ? amount : 0)
                .add(action === "totalIncome" ? amount : 0)
                .sub(action === "outgoingMoney" ? amount : 0)
                .sub(action === "totalExpense" ? amount : 0),
        },
      },
    });

    return dailyFinance;
  } catch (error) {
    console.error("Error updating muda finance:", error);
    throw error;
  }
};

// Example usage:
// await updateMudaFinance({
//   amount: new Prisma.Decimal(5000000),
//   action: 'incomingMoney',
//   tx: prismaTransaction
// });
