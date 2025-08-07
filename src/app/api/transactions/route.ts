import { NextResponse } from "next/server";
import {
  createIncome,
  createExpense,
  createOperational,
} from "@/lib/dailySummary/lainlain";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, nominal, description } = body;

    let result;
    if (type === "pemasukan") {
      result = await createIncome({ description, amount: +nominal });
    } else if (type === "pengeluaran") {
      result = await createExpense({ description, amount: +nominal });
    } else if (type === "operasional") {
      result = await createOperational({ description, amount: +nominal });
    } else {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: `${type} recorded successfully`,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process transaction" },
      { status: 500 }
    );
  }
}
