import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { error: "Code parameter is required" },
        { status: 400 }
      );
    }

    // Search in MudaGrocery table for muda items
    const grocery = await prisma.mudaGrocery.findUnique({
      where: {
        code: code,
      },
      include: {
        category: true,
      },
    });

    if (!grocery) {
      return NextResponse.json({ error: "Grocery not found" }, { status: 404 });
    }

    return NextResponse.json(grocery);
  } catch (error) {
    console.error("Error fetching muda grocery:", error);
    return NextResponse.json(
      { error: "Failed to fetch muda grocery" },
      { status: 500 }
    );
  }
}
