import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 });
    }

    // For now, search in regular Grocery table for muda items
    // Later will switch to MudaGrocery when Prisma client is updated
    const grocery = await prisma.grocery.findFirst({
      where: {
        code: code,
        // Ensure it's a muda item by checking code starts with M
        AND: [
          {
            code: {
              startsWith: 'M',
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        category: true,
      },
    });

    if (!grocery) {
      return NextResponse.json({ error: 'Grocery not found' }, { status: 404 });
    }

    return NextResponse.json(grocery);
  } catch (error) {
    console.error('Error fetching muda grocery:', error);
    return NextResponse.json({ error: 'Failed to fetch muda grocery' }, { status: 500 });
  }
}
