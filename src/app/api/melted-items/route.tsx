import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.meltedItem.findMany({
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          category: true,
        },
      }),
      prisma.meltedItem.count(),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching melted items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
