import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  try {
    const outgoingItem = await prisma.outgoingItem.findUnique({
      where: { code: String(code) },
      include: {
        grocery: true,
        customer: true,
      },
    });

    if (!outgoingItem) {
      return NextResponse.json(
        { error: 'Outgoing item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(outgoingItem);
  } catch (error) {
    console.error('Error fetching outgoing item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
