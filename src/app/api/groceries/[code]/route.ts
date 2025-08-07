import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  try {
    // Fetch the grocery item based on the provided code
    const grocery = await prisma.grocery.findFirst({
      where: { code },
      include: { category: true }, // Include category details if needed
    });

    if (!grocery) {
      return NextResponse.json({ error: "Perhiasan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(grocery);
  } catch (error) {
    console.error("Error fetching grocery data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
