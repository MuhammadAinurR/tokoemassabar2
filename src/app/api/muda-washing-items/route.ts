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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status'); // 'pending' or 'completed'
    const history = searchParams.get('history') === 'true';

    const skip = (page - 1) * limit;

    // For now, using regular WashingItem table with mode filtering
    // Later will switch to MudaWashingItem when Prisma client is updated
    const where: Prisma.WashingItemWhereInput = {
      // Filter for muda items by checking if the incoming item code starts with M
      // or has some other muda identifier
      incomingItem: {
        OR: [
          { code: { startsWith: 'M', mode: 'insensitive' } }, // Muda items start with M
          { source: 'muda' }, // Or have source = muda
        ],
      },
    };

    // Status filter
    if (status === 'pending') {
      where.isWashed = false;
    } else if (status === 'completed') {
      where.isWashed = true;
    }

    // History filter
    if (history) {
      where.isWashed = true; // Only show completed items in history
    }

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

    // Build additional incomingItem filters
    const incomingItemFilters: any = {
      OR: [{ code: { startsWith: 'M', mode: 'insensitive' } }, { source: 'muda' }],
    };

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      incomingItemFilters.date = dateFilter;
    }

    if (categoryId && categoryId !== 'all') {
      incomingItemFilters.categoryId = categoryId;
    }

    // Update the where clause with the complete incomingItem filter
    where.incomingItem = incomingItemFilters;

    // Build orderBy
    const orderBy: Prisma.WashingItemOrderByWithRelationInput = {};
    if (sort === 'date') {
      orderBy.incomingItem = { date: order as 'asc' | 'desc' };
    } else if (sort === 'customer.name') {
      orderBy.incomingItem = { customer: { name: order as 'asc' | 'desc' } };
    } else if (sort === 'category') {
      orderBy.incomingItem = { category: { name: order as 'asc' | 'desc' } };
    } else if (sort === 'isWashed') {
      orderBy.isWashed = order as 'asc' | 'desc';
    } else if (sort === 'code') {
      orderBy.incomingItem = { code: order as 'asc' | 'desc' };
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
    console.error('Error fetching muda washing items:', error);
    return NextResponse.json({ error: 'Failed to fetch muda washing items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, groceryData } = body;

    // Find the washing item
    const washingItem = await prisma.washingItem.findUnique({
      where: { id },
      include: { incomingItem: true },
    });

    if (!washingItem) {
      return NextResponse.json({ error: 'Washing item not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create new grocery record
      const grocery = await tx.grocery.create({
        data: {
          code: groceryData.code,
          name: groceryData.name,
          categoryId: groceryData.categoryId,
          tkr: groceryData.tkr,
          weight: parseFloat(groceryData.weight),
          price: parseFloat(groceryData.price || '0'),
        },
      });

      // Update washing item as completed
      const updatedWashingItem = await tx.washingItem.update({
        where: { id },
        data: {
          isWashed: true,
          washedAt: new Date(),
          newCode: groceryData.code,
        },
      });

      // Update category statistics
      await tx.category.update({
        where: { id: groceryData.categoryId },
        data: {
          itemCount: { increment: 1 },
          totalWeight: { increment: parseFloat(groceryData.weight) },
        },
      });

      return { grocery, washingItem: updatedWashingItem };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error completing muda washing item:', error);
    return NextResponse.json({ error: 'Failed to complete muda washing item' }, { status: 500 });
  }
}
