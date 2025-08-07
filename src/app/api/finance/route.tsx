import { getToday } from '@/lib/getToday';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Set default date range if not provided
    const today = getToday();
    const defaultStartDate = new Date(
      new Date(today.getFullYear(), today.getMonth(), 1).toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
      })
    );

    const defaultEndDate = new Date(
      new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
      })
    );

    // Ensure the end date is inclusive of the last day of the month
    const endDateInclusive = new Date(defaultEndDate);
    endDateInclusive.setHours(23, 59, 59, 999); // Set to the end of the day
    const where = {
      date: {
        gte: startDate
          ? new Date(
              new Date(startDate).toLocaleString('en-US', {
                timeZone: 'Asia/Jakarta',
                hour12: false,
              })
            )
          : defaultStartDate,
        lte: endDate
          ? new Date(
              new Date(endDate).toLocaleString('en-US', {
                timeZone: 'Asia/Jakarta',
                hour12: false,
              })
            )
          : endDateInclusive,
      },
    };

    // Get total count for pagination
    const total = await prisma.finance.count({ where });

    const finances = await prisma.finance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 10,
      skip: (page - 1) * 10,
    });

    // Use raw SQL to filter by date pattern to ensure exact month matching
    const monthlyFinances = await prisma.$queryRaw`
      SELECT * FROM "Finance" 
      WHERE EXTRACT(YEAR FROM "date") = ${year}
      AND EXTRACT(MONTH FROM "date") = ${month + 1}
      ORDER BY "date" DESC
    `;

    // Get monthly operasional costs using the same date filtering approach
    const monthlyOperasional = await prisma.$queryRaw`
      SELECT * FROM "Operational" 
      WHERE EXTRACT(YEAR FROM "createdAt") = ${year}
      AND EXTRACT(MONTH FROM "createdAt") = ${month + 1}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json({
      data: finances,
      monthlyData: monthlyFinances,
      monthlyOperasional: monthlyOperasional,
      pagination: {
        total,
        pages: Math.ceil(total / 10),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, storeClosingBalance } = body;

    const updatedFinance = await prisma.finance.update({
      where: { id },
      data: { storeClosingBalance },
    });

    return NextResponse.json(updatedFinance);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to update store closing balance' }, { status: 500 });
  }
}
