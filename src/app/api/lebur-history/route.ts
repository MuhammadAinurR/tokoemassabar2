import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust the import based on your project structure

interface LeburHistory {
  id: number;
  category: string;
  quantity: number;
  weight: number;
  code: string | null;
  createdAt: Date;
  name?: string;
  notes: string | null;
}

interface Category {
  id: number;
  name: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const offset = (page - 1) * limit;

  try {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const [history, total] = await Promise.all([
      prisma.leburHistory.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }) as Promise<LeburHistory[]>,
      prisma.leburHistory.count({ where: whereClause }),
    ]);

    // Fetch category names for the history items
    const categoryIds = history.map((item: any) => item.category);
    // Filter out null values from groceryCodes
    const groceryCodes = history
      .map((item: any) => item.code)
      .filter((code): code is string => code !== null);
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
    // Only query groceries if there are non-null codes
    const names = groceryCodes.length > 0 
      ? await prisma.grocery.findMany({
          where: {
            code: { in: groceryCodes },
          },
          select: {
            code: true,
            name: true,
          },
        })
      : [];

    // Create a map for quick lookup of category names
    const categoryMap = Object.fromEntries(categories.map((cat) => [cat.id, cat.name]));
    const nameMap = Object.fromEntries(names.map((item) => [item.code, item.name]));

    const mappedHistory = history.map((item) => ({
      ...item,
      category: categoryMap[item.category] || item.category, // Replace ID with name
      name: item.code ? nameMap[item.code] || "Unknown" : "Unknown", // Check if code is not null
    }));
    return NextResponse.json({ items: mappedHistory, total }, { status: 200 });
  } catch (error) {
    console.error("Error fetching lebur history:", error);
    return NextResponse.json({ error: "Failed to fetch lebur history" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { category, quantity, weight, code, notes } = await request.json();

  try {
    const newHistory = await prisma.leburHistory.create({
      data: {
        category,
        quantity,
        weight,
        code,
        notes,
      },
    });
    return NextResponse.json(newHistory, { status: 201 });
  } catch (error) {
    console.error("Error creating LeburHistory:", error);
    return NextResponse.json({ error: "Failed to log lebur action" }, { status: 500 });
  }
}
