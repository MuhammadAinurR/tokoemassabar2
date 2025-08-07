import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortField = searchParams.get('sortField') as string | null;
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' | null;

    let orderBy = {};

    if (sortField && sortDirection) {
      orderBy = {
        [sortField]: sortDirection.toLowerCase(),
      };
    } else {
      orderBy = { name: 'asc' };
    }

    const categories = await prisma.mudaCategory.findMany({
      orderBy,
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching muda categories:', error);
    return NextResponse.json({ error: 'Failed to fetch muda categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { code, name, goldContent, minimumPrice } = body;

    // Format code and name like the regular categories
    code = code.toUpperCase();
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const parsedMinimumPrice = parseFloat(minimumPrice?.toString() || '0');

    if (!code || !name || !goldContent) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check for existing muda category with same code
    const existingCategory = await prisma.mudaCategory.findFirst({
      where: {
        OR: [{ code }, { name }],
      },
    });

    if (existingCategory) {
      return NextResponse.json({ message: 'Category with this code or name already exists' }, { status: 400 });
    }

    const category = await prisma.mudaCategory.create({
      data: {
        code,
        name,
        goldContent,
        minimumPrice: parsedMinimumPrice,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating muda category:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, minimumPrice } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if muda category exists
    const existingCategory = await prisma.mudaCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Muda category not found' }, { status: 404 });
    }

    // Convert minimumPrice to float
    const minimumPriceFloat = parseFloat(minimumPrice?.toString() || '0');

    const category = await prisma.mudaCategory.update({
      where: { id },
      data: {
        minimumPrice: minimumPriceFloat,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating muda category:', error);
    return NextResponse.json({ error: 'Failed to update muda category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if muda category has items
    const category = await prisma.mudaCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Muda category not found' }, { status: 404 });
    }

    if (category.itemCount > 0 || category.totalWeight.toNumber() > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat modifikasi kategori jika jumlah barang lebih dari 0' },
        { status: 400 }
      );
    }

    await prisma.mudaCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting muda category:', error);
    return NextResponse.json({ error: 'Failed to delete muda category' }, { status: 500 });
  }
}
