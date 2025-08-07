import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { getToday } from "@/lib/getToday";
import { updateInventory } from "@/lib/dailySummary/inventory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId, weight, code, quantity } = body;

    // If code exists, get the grocery information first
    let itemWeight = weight;
    let itemCategoryId = categoryId;

    if (code) {
      const existingMeltedItem = await prisma.meltedItem.findFirst({
        where: { code },
      });

      if (existingMeltedItem) {
        return NextResponse.json({ error: "Barang sudah pernah dilebur" }, { status: 400 });
      }

      // Get the grocery information
      const grocery = await prisma.grocery.findUnique({
        where: { code },
        include: { category: true },
      });

      if (!grocery) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      itemWeight = parseFloat(grocery.weight.toString());
      itemCategoryId = grocery.categoryId;
    }

    // Get the category to determine the type
    const category = await prisma.category.findUnique({
      where: { id: itemCategoryId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if there's enough quantity and weight
      if (category.itemCount < quantity) {
        throw new Error(`Stok barang tidak mencukupi (tersedia: ${category.itemCount})`);
      }

      if (parseFloat(category.totalWeight.toString()) < itemWeight) {
        throw new Error(`Berat total tidak mencukupi (tersedia: ${category.totalWeight}g)`);
      }

      // Save melted item history
      await tx.meltedItem.create({
        data: {
          code,
          categoryId: itemCategoryId,
          weight: itemWeight,
          quantity: 1,
        },
      });

      // Use updateInventory which will handle category updates
      const categoryType = category.name.split(" ")[0].toLowerCase();
      const updatedSummary = await updateInventory({
        weight: itemWeight,
        quantity: 1,
        itemType: categoryType,
        action: "destroy",
        tx,
        categoryId: itemCategoryId,
      });

      // If code exists, update the grocery status
      if (code) {
        await tx.grocery.update({
          where: { code },
          data: { isSold: true },
        });
      }

      return updatedSummary;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in lebur API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 400 }
    );
  }
}
