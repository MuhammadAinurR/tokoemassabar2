import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, weight, quantity, code, notes } = body;

    if (!categoryId || !weight || !quantity) {
      return NextResponse.json(
        { error: "Category ID, weight, and quantity are required" },
        { status: 400 }
      );
    }

    // For muda mode, we would handle melting operations specific to emas muda items
    // This should check for M-prefixed codes and handle accordingly

    // If code is provided, check if it exists and is a muda item (M prefix)
    if (code) {
      const mudaGrocery = await prisma.mudaGrocery.findUnique({
        where: { code },
        include: { category: true },
      });

      if (!mudaGrocery) {
        return NextResponse.json(
          { error: "Muda grocery item not found" },
          { status: 404 }
        );
      }

      if (mudaGrocery.isSold) {
        return NextResponse.json(
          { error: "Muda grocery item is already sold" },
          { status: 400 }
        );
      }

      // Mark the muda grocery as melted
      await prisma.mudaGrocery.update({
        where: { code },
        data: { isSold: true },
      });
    }

    // Get muda category information
    const mudaCategory = await prisma.mudaCategory.findUnique({
      where: { id: categoryId },
    });

    if (!mudaCategory) {
      return NextResponse.json(
        { error: "Muda category not found" },
        { status: 404 }
      );
    }

    // For now, we'll use the same lebur processing logic but this should be mode-specific
    // This would typically update MudaDailySummary tables when available

    return NextResponse.json({
      success: true,
      message: "Muda item melted successfully",
    });
  } catch (error) {
    console.error("Error processing muda lebur:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
