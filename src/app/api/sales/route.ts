import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateInventory } from "@/lib/dailySummary/inventory";
import * as z from "zod";
import { updateFinance } from "@/lib/dailySummary/finance";
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
  const searchParams = new URL(req.url).searchParams;
  const sort = searchParams.get("sort") || "date";
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const minWeight = searchParams.get("minWeight");
  const maxWeight = searchParams.get("maxWeight");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  try {
    const where = {
      AND: [
        search
          ? {
              OR: [
                { grocery: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
                { customer: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
                { category: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
                { code: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
              ],
            }
          : {},
        startDate ? { date: { gte: new Date(startDate) } } : {},
        endDate ? { date: { lte: new Date(endDate) } } : {},
        minWeight ? { grocery: { weight: { gte: parseFloat(minWeight) } } } : {},
        maxWeight ? { grocery: { weight: { lte: parseFloat(maxWeight) } } } : {},
      ],
    };

    // Handle nested sorting
    const orderBy: Prisma.OutgoingItemOrderByWithRelationInput = {};
    if (sort.includes(".")) {
      const [parent, child, grandchild] = sort.split(".");
      if (grandchild) {
        orderBy[parent as keyof Prisma.OutgoingItemOrderByWithRelationInput] = {
          [child]: {
            [grandchild]: order as Prisma.SortOrder,
          },
        } as any;
      } else {
        orderBy[parent as keyof Prisma.OutgoingItemOrderByWithRelationInput] = {
          [child]: order as Prisma.SortOrder,
        } as any;
      }
    } else {
      orderBy[sort as keyof Prisma.OutgoingItemOrderByWithRelationInput] = order as Prisma.SortOrder;
    }

    const [sales, total] = await Promise.all([
      prisma.outgoingItem.findMany({
        where,
        include: {
          customer: true,
          category: true,
          grocery: {
            include: {
              category: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.outgoingItem.count({ where }),
    ]);

    return NextResponse.json({
      data: sales,
      metadata: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
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

          const grocery = await tx.grocery.findUnique({
            where: { code: validatedData.groceryCode },
            include: { category: true },
          });

          if (!grocery) {
            throw new Error("Perhiasan tidak ditemukan");
          }

          const sale = await tx.outgoingItem.create({
            data: {
              code: validatedData.groceryCode,
              groceryCode: validatedData.groceryCode,
              categoryId: grocery.categoryId,
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

          await updateInventory({
            weight: Number(grocery.weight),
            quantity: 1,
            itemType: grocery.category.name.toLowerCase(),
            action: "decrease",
            categoryId: grocery.categoryId,
            tx,
          });

          await updateFinance({
            amount: grocery.weight,
            action: "outgoingItems",
            tx,
          });

          await updateFinance({
            amount: sale.sellPrice,
            action: "incomingMoney",
            tx,
          });

          await tx.grocery.update({
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
      return NextResponse.json({ error: "Invalid sale data", details: error.errors }, { status: 400 });
    }

    console.error("Sale creation error:", error);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
