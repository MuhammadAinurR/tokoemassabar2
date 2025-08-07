import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateMudaInventory } from "@/lib/dailySummary/mudaInventory";
import * as z from "zod";
import { updateMudaFinance } from "@/lib/dailySummary/mudaFinance";
import { Prisma } from "@prisma/client";
import { getToday } from "@/lib/getToday";

const saleSchema = z.object({
  groceryCode: z.string().min(1),
  customerId: z.string().min(1),
  sellPrice: z.number().min(0),
});

type WhereClause = {
  AND?: {
    code?: { contains: string; mode: "insensitive" };
    customer?: { name: { contains: string; mode: "insensitive" } };
    category?: { name: { contains: string; mode: "insensitive" } };
  }[];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const sort = searchParams.get("sort") || "date";
    const order = searchParams.get("order") || "desc";
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minWeight = searchParams.get("minWeight");
    const maxWeight = searchParams.get("maxWeight");

    const skip = (page - 1) * limit;

    // For muda mode, use MudaOutgoingItem table
    const where: Prisma.MudaOutgoingItemWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { grocery: { name: { contains: search, mode: "insensitive" } } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.date = dateFilter;
    }

    if (minWeight || maxWeight) {
      const weightFilter: any = {};
      if (minWeight) {
        weightFilter.gte = parseFloat(minWeight);
      }
      if (maxWeight) {
        weightFilter.lte = parseFloat(maxWeight);
      }
      where.grocery = {
        ...where.grocery,
        weight: weightFilter,
      };
    }

    // Build orderBy for MudaOutgoingItem
    const orderBy: Prisma.MudaOutgoingItemOrderByWithRelationInput = {};
    if (sort === "date") {
      orderBy.date = order as "asc" | "desc";
    } else if (sort === "customer.name") {
      orderBy.customer = { name: order as "asc" | "desc" };
    } else if (sort === "category.name") {
      orderBy.category = { name: order as "asc" | "desc" };
    } else if (sort === "sellPrice") {
      orderBy.sellPrice = order as "asc" | "desc";
    } else if (sort === "code") {
      orderBy.code = order as "asc" | "desc";
    } else if (sort === "grocery.weight") {
      orderBy.grocery = { weight: order as "asc" | "desc" };
    }

    const [sales, total] = await Promise.all([
      prisma.mudaOutgoingItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: true,
          category: true,
          grocery: {
            include: {
              category: true,
            },
          },
        },
      }),
      prisma.mudaOutgoingItem.count({ where }),
    ]);

    return NextResponse.json({
      data: sales,
      metadata: {
        totalPages: Math.ceil(total / limit),
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching muda sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch muda sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const salesData = Array.isArray(body) ? body : [body]; // Ensure it's an array

    const results = await prisma.$transaction(async (tx) => {
      return Promise.all(
        salesData.map(async (data) => {
          const validatedData = saleSchema.parse(data);

          // Search in MudaGrocery table for muda items
          const mudaGrocery = await tx.mudaGrocery.findFirst({
            where: {
              code: validatedData.groceryCode,
            },
            include: { category: true },
          });

          if (!mudaGrocery) {
            throw new Error("Perhiasan muda tidak ditemukan");
          }

          // Create muda outgoing item record
          const sale = await tx.mudaOutgoingItem.create({
            data: {
              code: validatedData.groceryCode,
              groceryCode: validatedData.groceryCode,
              categoryId: mudaGrocery.categoryId,
              customerId: validatedData.customerId,
              date: getToday(),
              sellPrice: new Prisma.Decimal(validatedData.sellPrice),
            },
            include: {
              customer: true,
              category: true,
              grocery: true,
            },
          });

          await updateMudaInventory({
            weight: Number(mudaGrocery.weight),
            quantity: 1,
            itemType: mudaGrocery.category.name.toLowerCase(),
            action: "decrease",
            categoryId: mudaGrocery.categoryId,
            tx,
          });

          await updateMudaFinance({
            amount: mudaGrocery.weight,
            action: "outgoingItems",
            tx,
          });

          await updateMudaFinance({
            amount: sale.sellPrice,
            action: "incomingMoney",
            tx,
          });

          await tx.mudaGrocery.update({
            where: { code: validatedData.groceryCode },
            data: {
              isSold: true,
            },
          });

          return sale;
        })
      );
    });

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid sale data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Muda sale creation error:", error);
    return NextResponse.json(
      { error: "Failed to create muda sale" },
      { status: 500 }
    );
  }
}
