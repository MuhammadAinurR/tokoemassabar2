import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryCode = searchParams.get('categoryCode');

    if (!categoryCode) {
      return NextResponse.json({ error: 'Category code is required' }, { status: 400 });
    }

    // For now, search in regular Grocery table for muda items
    // Later will switch to MudaGrocery when Prisma client is updated
    // Look for codes that start with categoryCode + M (muda mode prefix)
    const latestGrocery = await prisma.grocery.findFirst({
      where: {
        code: {
          startsWith: `${categoryCode}M`, // Muda items have M after category code
          mode: 'insensitive',
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    if (!latestGrocery) {
      return NextResponse.json(null);
    }

    return NextResponse.json(latestGrocery);
  } catch (error) {
    console.error('Error fetching latest muda grocery code:', error);
    return NextResponse.json({ error: 'Failed to fetch latest muda grocery code' }, { status: 500 });
  }
}
