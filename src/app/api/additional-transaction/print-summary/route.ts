import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as
      | "income"
      | "expense"
      | "operasional"
      | null;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!type) {
      return NextResponse.json(
        { error: "Transaction type is required" },
        { status: 400 }
      );
    }

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const dateFilter = {
      createdAt: {
        gte: new Date(start),
        lte: new Date(end),
      },
    };

    let transactions;
    let totalAmount = 0;

    switch (type) {
      case "income":
        transactions = await prisma.income.findMany({
          where: dateFilter,
          orderBy: { createdAt: "desc" },
        });
        break;
      case "expense":
        transactions = await prisma.expense.findMany({
          where: dateFilter,
          orderBy: { createdAt: "desc" },
        });
        break;
      case "operasional":
        transactions = await prisma.operational.findMany({
          where: dateFilter,
          orderBy: { createdAt: "desc" },
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid transaction type" },
          { status: 400 }
        );
    }

    // Calculate total amount
    totalAmount = transactions.reduce((sum, transaction) => {
      const amount =
        typeof transaction.amount === "string"
          ? parseFloat(transaction.amount)
          : typeof transaction.amount === "number"
          ? transaction.amount
          : parseFloat(transaction.amount.toString());
      return sum + amount;
    }, 0);

    return NextResponse.json({
      transactions,
      summary: {
        totalAmount,
        count: transactions.length,
        startDate: start,
        endDate: end,
        type,
      },
    });
  } catch (error) {
    console.error("Error fetching print summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch print summary" },
      { status: 500 }
    );
  }
}
