import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * pageSize;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause based on date filters
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // For muda mode, get melted items from MudaMeltedItem table
    const [data, totalCount] = await Promise.all([
      prisma.mudaMeltedItem.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.mudaMeltedItem.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    // Map the data to include proper structure for the frontend
    const mappedData = data.map((item) => ({
      id: item.id,
      date: item.date,
      code: item.code,
      weight: item.weight,
      quantity: item.quantity,
      category: {
        name: item.category.name,
        goldContent: item.category.goldContent,
      },
      createdAt: item.createdAt,
      name: item.code ? "Unknown" : "Label Hilang", // Default name based on code availability
      notes: null, // MudaMeltedItem doesn't have notes field yet
    }));

    return NextResponse.json({
      items: mappedData,
      total: totalCount,
      pagination: {
        page,
        pages: totalPages,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching muda lebur history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, quantity, weight, code, notes } = body;

    // Create lebur history record for muda mode using MudaMeltedItem table
    const mudaMeltedItem = await prisma.mudaMeltedItem.create({
      data: {
        categoryId: category,
        quantity: parseInt(quantity),
        weight: parseFloat(weight),
        code: code || null,
        date: new Date(),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(mudaMeltedItem);
  } catch (error) {
    console.error("Error logging muda lebur action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
