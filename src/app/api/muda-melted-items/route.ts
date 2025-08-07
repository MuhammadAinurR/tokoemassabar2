import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    // For muda mode, get melted items from MudaMeltedItem table
    const [data, totalCount] = await Promise.all([
      prisma.mudaMeltedItem.findMany({
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.mudaMeltedItem.count(),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pages: totalPages,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching muda melted items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
