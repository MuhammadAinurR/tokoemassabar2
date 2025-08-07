import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sort = searchParams.get("sort") || "date";
  const order = searchParams.get("order") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";

  try {
    const skip = (page - 1) * limit;

    let orderByConfig: any;

    switch (sort) {
      case "code":
        orderByConfig = { incomingItem: { code: order } };
        break;
      case "date":
        orderByConfig = { incomingItem: { date: order } };
        break;
      case "customer.name":
        orderByConfig = { incomingItem: { customer: { name: order } } };
        break;
      case "name":
        orderByConfig = { incomingItem: { name: order } };
        break;
      case "category":
        orderByConfig = { incomingItem: { category: { name: order } } };
        break;
      case "isWashed":
        orderByConfig = { isWashed: order };
        break;
      default:
        orderByConfig = { incomingItem: { date: order } };
    }

    const [items, total] = await Promise.all([
      prisma.washingItem.findMany({
        where: {
          isWashed: true,
          OR: [
            { incomingItem: { code: { contains: search } } },
            { incomingItem: { customer: { name: { contains: search } } } },
          ],
        },
        include: {
          incomingItem: {
            include: {
              grocery: { include: { category: true } },
              category: true,
              customer: true,
            },
          },
        },
        orderBy: orderByConfig,
        take: limit,
        skip,
      }),
      prisma.washingItem.count({
        where: {
          isWashed: true,
          OR: [
            { incomingItem: { code: { contains: search } } },
            { incomingItem: { customer: { name: { contains: search } } } },
          ],
        },
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
