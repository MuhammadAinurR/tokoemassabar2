import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Define a custom error type
interface PrismaError extends Error {
  code?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortField = searchParams.get('sortField') as string | null;
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' | null;

    let orderBy = {};

    if (sortField && sortDirection) {
      orderBy = {
        [sortField]: sortDirection.toLowerCase(),
      };
    }

    const categories = await prisma.category.findMany({
      orderBy: orderBy,
    });

    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { code, name } = body;
    const goldContent = body.goldContent;
    const minimumPrice = parseFloat(body.minimumPrice?.toString() || '0');
    code = code.toUpperCase();
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    // Validate required fields
    if (!code || !name || !goldContent) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 });
    }

    // Check for existing category with same code
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          {
            AND: [{ code }, { name }, { goldContent }],
          },
        ],
      },
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Kombinasi kode, nama dan kadar emas sudah ada' }, { status: 400 });
    }

    // Validate code format (2 characters)
    if (code.length !== 2) {
      return NextResponse.json({ error: 'Kode harus 2 karakter' }, { status: 400 });
    }

    // Validate name length (max 7 characters)
    if (name.length > 7) {
      return NextResponse.json({ error: 'Nama tidak boleh lebih dari 7 karakter' }, { status: 400 });
    }

    // Validate gold content (0-24)
    if (goldContent < 0 || goldContent > 24) {
      return NextResponse.json({ error: 'Kadar emas harus antara 0 dan 24' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        code,
        name,
        goldContent,
        minimumPrice,
        itemCount: 0,
        totalWeight: 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as PrismaError;
    if (prismaError.code === 'P2002') {
      return NextResponse.json({ error: 'Kode kategori sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menambahkan kategori' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, minimumPrice } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Convert minimumPrice to float
    const minimumPriceFloat = parseFloat(minimumPrice?.toString() || '0');

    const category = await prisma.category.update({
      where: { id },
      data: {
        minimumPrice: minimumPriceFloat,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category has items
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.itemCount > 0 || category.totalWeight.toNumber() > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat modifikasi kategori jika jumlah barang lebih dari 0' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
