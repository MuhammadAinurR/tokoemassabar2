import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const updatedCustomer = await prisma.customer.update({
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

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}