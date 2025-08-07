import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const categoryCode = req.nextUrl.searchParams.get("categoryCode");

    if (!categoryCode) {
      return NextResponse.json({ error: "Category code is required" }, { status: 400 });
    }

    const latestGrocery = await prisma.grocery.findFirst({
      where: { code: { startsWith: categoryCode } },
      orderBy: { code: "desc" },
    });

    return NextResponse.json(latestGrocery);
  } catch (error) {
    console.error("Error fetching latest code:", error);
    return NextResponse.json({ error: "Failed to fetch latest code" }, { status: 500 });
  }
}
