import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json([]);
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { idNumber: { contains: query } },
        ],
      },
      take: 10, // Limit results
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Customer search error:', error);
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    );
  }
}
