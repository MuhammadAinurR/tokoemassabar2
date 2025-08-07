import { getToday } from "@/lib/getToday";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Set default date range if not provided
    const today = getToday();
    const where = {
      date:
        startDate || endDate
          ? {
              gte: startDate
                ? new Date(
                    new Date(startDate).toLocaleString("en-US", {
                      timeZone: "Asia/Jakarta",
                      hour12: false,
                    })
                  )
                : undefined,
              lte: endDate
                ? new Date(
                    new Date(endDate).toLocaleString("en-US", {
                      timeZone: "Asia/Jakarta",
                      hour12: false,
                    })
                  )
                : undefined,
            }
          : undefined,
    };

    // Get total count for pagination
    const total = await prisma.dailySummary.count({ where });

    const summaries = await prisma.dailySummary.findMany({
      where,
      orderBy: { date: "desc" },
      take: 10,
      skip: (page - 1) * 10,
    });

    return NextResponse.json({
      data: summaries,
      pagination: {
        total,
        pages: Math.ceil(total / 10),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch daily summaries" }, { status: 500 });
  }
}
