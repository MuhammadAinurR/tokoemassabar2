import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const sort = searchParams.get("sort") || "date";
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const limit = 10;
  const offset = (page - 1) * limit;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const minWeight = searchParams.get("minWeight");
  const maxWeight = searchParams.get("maxWeight");
  const isSold = searchParams.get("isSold");

  try {
    // Handle nested sorting
    const orderBy: Prisma.IncomingItemOrderByWithRelationInput = {};
    if (sort.includes(".")) {
      const [parent, child, grandchild] = sort.split(".");
      if (grandchild) {
        orderBy[parent as keyof Prisma.IncomingItemOrderByWithRelationInput] = {
          [child]: {
            [grandchild]: order as Prisma.SortOrder,
          },
        } as any;
      } else {
        orderBy[parent as keyof Prisma.IncomingItemOrderByWithRelationInput] = {
          [child]: order as Prisma.SortOrder,
        } as any;
      }
    } else {
      orderBy[sort as keyof Prisma.IncomingItemOrderByWithRelationInput] = order as Prisma.SortOrder;
    }

    // Get all sold items and lebur history codes first
    const [soldItems, leburHistory] = await Promise.all([
      prisma.outgoingItem.findMany({
        select: { code: true },
      }),
      prisma.leburHistory.findMany({
        select: { code: true },
      }),
    ]);

    // Create Sets for faster lookup
    const soldItemCodes = new Set(soldItems.map((item) => item.code));
    const leburItemCodes = new Set(leburHistory.map((item) => item.code));

    // Build the where clause
    const where: Prisma.IncomingItemWhereInput = {
      AND: [
        { source: { not: "customer" } },
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
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
        // Add isSold filter at database level
        isSold
          ? {
              OR: [
                isSold === "terjual"
                  ? { code: { in: Array.from(soldItemCodes).filter((code): code is string => code !== null) } }
                  : {},
                isSold === "lebur"
                  ? { code: { in: Array.from(leburItemCodes).filter((code): code is string => code !== null) } }
                  : {},
                isSold === "belum terjual"
                  ? {
                      AND: [
                        { code: { notIn: Array.from(soldItemCodes).filter((code): code is string => code !== null) } },
                        { code: { notIn: Array.from(leburItemCodes).filter((code): code is string => code !== null) } },
                      ],
                    }
                  : {},
              ],
            }
          : {},
      ],
    };

    // Get paginated data with total count
    const [purchases, total] = await Promise.all([
      prisma.incomingItem.findMany({
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
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}
