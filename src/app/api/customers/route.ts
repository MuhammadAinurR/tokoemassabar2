import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as z from 'zod';

const customerSchema = z.object({
  name: z.string().min(1).max(50),
  idNumber: z.string().optional(),
  address: z.string().min(1),
  phoneNumber: z.string().max(15).optional(),
  isSupplier: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Only check for existing customer if idNumber is provided
    if (validatedData.idNumber !== '') {
      const existingCustomer = await prisma.customer.findFirst({
        where: { idNumber: validatedData.idNumber },
      });

      if (existingCustomer) {
        return NextResponse.json({ error: 'Customer with this ID number already exists' }, { status: 400 });
      }
    }

    const customer = await prisma.customer.create({
      data: validatedData,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid customer data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Customer fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
