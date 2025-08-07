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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 10;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!type) {
      return NextResponse.json(
        { error: "Transaction type is required" },
        { status: 400 }
      );
    }

    const dateFilter =
      start && end
        ? { createdAt: { gte: new Date(start), lte: new Date(end) } }
        : {};

    let transactions;
    switch (type) {
      case "income":
        transactions = await prisma.income.findMany({
          where: dateFilter,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        });
        break;
      case "expense":
        transactions = await prisma.expense.findMany({
          where: dateFilter,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        });
        break;
      case "operasional":
        transactions = await prisma.operational.findMany({
          where: dateFilter,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid transaction type" },
          { status: 400 }
        );
    }

    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
