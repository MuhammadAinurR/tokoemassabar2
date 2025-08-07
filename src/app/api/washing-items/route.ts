import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToday } from "@/lib/getToday";
import { updateInventory } from "@/lib/dailySummary/inventory";
import { Prisma } from "@prisma/client";
interface WashingItem {
  id: string;
  isWashed: boolean;
  washedAt: Date | null;
  incomingItemId: string;
  incomingItem: {
    category: Category;
    customer: {
      name: string;
    };
  };
}

interface Category {
  name: string;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sort = searchParams.get("sort") || "date";
  const order = searchParams.get("order") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status"); // 'pending' or 'completed'

  try {
    const skip = (page - 1) * limit;

    let orderBy: any = {};

    switch (sort) {
      case "code":
        orderBy = { incomingItem: { code: order } };
        break;
      case "date":
        orderBy = { incomingItem: { date: order } };
        break;
      case "customer.name":
        orderBy = { incomingItem: { customer: { name: order } } };
        break;
      case "category":
        orderBy = { incomingItem: { category: { name: order } } };
        break;
      case "isWashed":
        orderBy = { isWashed: order };
        break;
      default:
        orderBy = { incomingItem: { date: order } };
    }

    // Create start and end of day dates for filtering
    const dateFilter = {
      ...(startDate && {
        gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
      }),
      ...(endDate && {
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      }),
    };

    const whereClause = {
      AND: [
        search
          ? {
              OR: [
                { incomingItem: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
                { incomingItem: { code: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
                { incomingItem: { customer: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } } },
                { incomingItem: { category: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } } },
              ],
            }
          : {},
        Object.keys(dateFilter).length > 0 ? { incomingItem: { date: dateFilter } } : {},
        categoryId && categoryId !== "all"
          ? {
              incomingItem: {
                category: {
                  name: {
                    equals: await prisma.category.findUnique({ where: { id: categoryId } }).then((cat) => cat?.name),
                  },
                },
              },
            }
          : {},
        status === "pending" ? { isWashed: false } : status === "completed" ? { isWashed: true } : {},
      ],
    };

    const [items, total] = await Promise.all([
      prisma.washingItem.findMany({
        where: whereClause,
        include: {
          incomingItem: {
            include: {
              grocery: { include: { category: true } },
              category: true,
              customer: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip,
      }),
      prisma.washingItem.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      data: items,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching washing items:", error);
    return NextResponse.json({ error: "Failed to fetch washing items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, groceryData } = await req.json();
    const result = await prisma.$transaction(async (tx) => {
      // First get the washing item to access its data
      const washingItem = await tx.washingItem.findUnique({
        where: { id },
        include: {
          incomingItem: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!washingItem) {
        throw new Error("Washing item not found");
      }

      // Create new Grocery entry
      await tx.grocery.create({
        data: {
          code: groceryData.code,
          categoryId: groceryData.categoryId,
          weight: parseFloat(groceryData.weight),
          price: parseFloat(groceryData.price),
          isSold: false,
          tkr: groceryData.tkr,
          name: groceryData.name,
        },
      });

      // Create incoming item with sellPrice and newCode
      await tx.incomingItem.create({
        data: {
          code: groceryData.code, // Use the generated code
          name: groceryData.name,
          groceryCode: groceryData.code,
          categoryId: groceryData.categoryId,
          customerId: washingItem.incomingItem.customerId,
          quantity: 1,
          buyPrice: parseFloat(groceryData.price),
          date: getToday(),
          source: "washing",
          ...(groceryData.sellPrice && {
            sellPrice: parseFloat(groceryData.sellPrice),
          }),
        },
      });

      // Add inventory update
      await updateInventory({
        weight: parseFloat(groceryData.weight),
        quantity: 1,
        itemType: groceryData.category.name.toLowerCase(),
        action: "increase",
        tx,
        categoryId: groceryData.categoryId,
      });

      // Update washing item to mark as complete and store the new code
      const updatedWashingItem = await tx.washingItem.update({
        where: { id },
        data: {
          isWashed: true,
          washedAt: new Date(getToday()),
          newCode: groceryData.code, // Store the new code
        },
        include: {
          incomingItem: {
            include: {
              category: true,
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return updatedWashingItem;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error completing washing item:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to complete washing item",
      },
      { status: 500 }
    );
  }
}
