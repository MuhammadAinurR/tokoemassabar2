import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const all = searchParams.get("all");

    // Build where clause based on date filters
    const where: any = {};
    if (startDate) {
      where.date = {
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate),
      };
    }

    // If 'all' parameter is true, fetch all data without pagination
    if (all === "true") {
      const data = await prisma.mudaDailySummary.findMany({
        where,
        orderBy: {
          date: "desc",
        },
      });

      return NextResponse.json({ data });
    }

    // Regular paginated response
    const [data, totalCount] = await Promise.all([
      prisma.mudaDailySummary.findMany({
        where,
        orderBy: {
          date: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.mudaDailySummary.count({ where }),
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
    console.error("Error fetching muda daily summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
