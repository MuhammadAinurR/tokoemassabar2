import prisma from "@/lib/prisma";
import { updateFinance } from "./finance";
import { Prisma } from "@prisma/client";

interface FinanceInput {
  description: string;
  amount: number;
  date?: Date;
}

export async function createIncome({ description, amount }: FinanceInput) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const dbAmount = new Prisma.Decimal(amount);

      const income = await tx.income.create({
        data: {
          description,
          amount: dbAmount,
        },
      });

      await updateFinance({
        amount: dbAmount,
        action: "totalIncome",
        tx,
      });

      return income;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating income:", error);
    return { success: false, error: "Failed to create income entry" };
  }
}

export async function createExpense({ description, amount }: FinanceInput) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const dbAmount = new Prisma.Decimal(amount);

      const expense = await tx.expense.create({
        data: {
          description,
          amount: dbAmount,
        },
      });

      await updateFinance({
        amount: dbAmount,
        action: "totalExpense",
        tx,
      });

      return expense;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense entry" };
  }
}

export async function createOperational({ description, amount }: FinanceInput) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const dbAmount = new Prisma.Decimal(amount);

      const operational = await tx.operational.create({
        data: {
          description,
          amount: dbAmount,
        },
      });

      await updateFinance({
        amount: dbAmount,
        action: "totalExpense",
        tx,
      });

      return operational;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating operational:", error);
    return { success: false, error: "Failed to create operational entry" };
  }
}

// Export examples for testing
// export const examples = {
//     sampleIncome: {
//       description: "Test income",
//       amount: 1000000,
//     },
//     sampleExpense: {
//       description: "Test expense",
//       amount: 500000,
//     },
//   };
