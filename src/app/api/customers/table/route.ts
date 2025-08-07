import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'id';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  try {
    const total = await prisma.customer.count({
      where: {
        isSupplier: false,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { idNumber: { contains: search, mode: 'insensitive' } },
        ],
      },
    });

    const suppliers = await prisma.customer.findMany({
      where: {
        isSupplier: false,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { idNumber: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        idNumber: true,
        address: true,
        phoneNumber: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: suppliers,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
    try {
      const data = await request.json();
      const newSupplier = await prisma.customer.create({
        data: {
          name: data.name,
          idNumber: data.idNumber,
          address: data.address,
          phoneNumber: data.phoneNumber,
          isSupplier: false,
        },
      });
  
      return NextResponse.json(newSupplier);
    } catch (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json(
        { error: 'Failed to create supplier' },
        { status: 500 }
      );
    }
  }