import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "date";
    const order = searchParams.get("order") || "desc";
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minWeight = searchParams.get("minWeight");
    const maxWeight = searchParams.get("maxWeight");

    const skip = (page - 1) * limit;

    // Build where condition - for now using regular IncomingItem table
    // Later will switch to MudaIncomingItem when Prisma client is updated
    const where: Prisma.IncomingItemWhereInput = {
      // Add a filter for muda items (using a naming convention or flag)
      OR: [
        { code: { startsWith: "M", mode: "insensitive" } }, // Muda items start with M
        { source: "muda" }, // Or have source = muda
      ],
    };

    if (search) {
      where.AND = [
        where,
        {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
          ],
        },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (minWeight || maxWeight) {
      where.weight = {};
      if (minWeight) {
        where.weight.gte = parseFloat(minWeight);
      }
      if (maxWeight) {
        where.weight.lte = parseFloat(maxWeight);
      }
    }

    // Build orderBy
    const orderBy: Prisma.IncomingItemOrderByWithRelationInput = {};
    if (sort === "date") {
      orderBy.date = order as "asc" | "desc";
    } else if (sort === "weight") {
      orderBy.weight = order as "asc" | "desc";
    } else if (sort === "price") {
      orderBy.price = order as "asc" | "desc";
    } else if (sort === "customer") {
      orderBy.customer = { name: order as "asc" | "desc" };
    } else if (sort === "category") {
      orderBy.category = { name: order as "asc" | "desc" };
    }

    // Get sold and lebur item codes for status determination
    const [soldItems, leburItems] = await Promise.all([
      prisma.mudaOutgoingItem.findMany({
        select: { groceryCode: true },
      }),
      prisma.mudaMeltedItem.findMany({
        select: { code: true },
      }),
    ]);

    const soldItemCodes = new Set(soldItems.map((item) => item.groceryCode));
    const leburItemCodes = new Set(
      leburItems.map((item) => item.code).filter(Boolean)
    );

    const [purchases, total] = await Promise.all([
      prisma.incomingItem.findMany({
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
      prisma.incomingItem.count({ where }),
    ]);

    // Transform purchases to include status
    const transformedPurchases = purchases.map((purchase) => ({
      ...purchase,
      isSold: purchase.code
        ? leburItemCodes.has(purchase.code)
          ? "lebur"
          : soldItemCodes.has(purchase.code)
          ? "terjual"
          : "belum terjual"
        : "belum terjual",
    }));

    return NextResponse.json({
      items: transformedPurchases,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching muda incoming items:", error);
    return NextResponse.json(
      { error: "Failed to fetch muda incoming items" },
      { status: 500 }
    );
  }
}
