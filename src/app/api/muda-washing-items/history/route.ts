import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'date';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // For now, using regular WashingItem table with mode filtering for completed items
    // Later will switch to MudaWashingItem when Prisma client is updated
    const where: Prisma.WashingItemWhereInput = {
      isWashed: true, // Only completed washing items
      incomingItem: {
        OR: [
          { code: { startsWith: 'M', mode: 'insensitive' } }, // Muda items start with M
          { source: 'muda' }, // Or have source = muda
        ],
      },
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { incomingItem: { code: { contains: search, mode: 'insensitive' } } },
            { incomingItem: { name: { contains: search, mode: 'insensitive' } } },
            { incomingItem: { customer: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.WashingItemOrderByWithRelationInput = {};
    if (sort === 'date') {
      orderBy.incomingItem = { date: order as 'asc' | 'desc' };
    } else if (sort === 'customer.name') {
      orderBy.incomingItem = { customer: { name: order as 'asc' | 'desc' } };
    } else if (sort === 'category') {
      orderBy.incomingItem = { category: { name: order as 'asc' | 'desc' } };
    } else if (sort === 'code') {
      orderBy.incomingItem = { code: order as 'asc' | 'desc' };
    } else if (sort === 'washedAt') {
      orderBy.washedAt = order as 'asc' | 'desc';
    }

    const [items, total] = await Promise.all([
      prisma.washingItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          incomingItem: {
            include: {
              customer: true,
              category: true,
              grocery: true,
            },
          },
        },
      }),
      prisma.washingItem.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching muda washing history:', error);
    return NextResponse.json({ error: 'Failed to fetch muda washing history' }, { status: 500 });
  }
}
