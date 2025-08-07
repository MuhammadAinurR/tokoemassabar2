import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const updatedSupplier = await prisma.customer.update({
      where: {
        id: params.id,
      },
      data: {
        name: data.name,
        idNumber: data.idNumber,
        address: data.address,
        phoneNumber: data.phoneNumber,
      },
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}