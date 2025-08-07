import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    const where: any = {
      customer: { contains: search, mode: "insensitive" },
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [services, total] = await Promise.all([
      prisma.groceryService.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.groceryService.count({ where }),
    ]);

    return NextResponse.json({
      services,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching services" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const service = await prisma.groceryService.create({
      data: {
        customer: body.customer,
        phoneNumber: body.phoneNumber,
        address: body.address,
        jewelryName: body.jewelryName,
        weight: body.weight ? parseFloat(body.weight) : null,
        description: body.description,
        ongkos: body.ongkos ? parseFloat(body.ongkos) : null,
        isDone: false,
      },
    });
    return NextResponse.json(service);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error creating service" },
      { status: 500 }
    );
  }
}
