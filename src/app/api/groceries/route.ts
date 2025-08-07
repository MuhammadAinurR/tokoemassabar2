import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type GroceryRequestBody = {
  categoryCode: string;
  weight: number;
  price: number;
  name: string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const { categoryCode, weight, price, name } = body as GroceryRequestBody;

  try {
    // Find the category
    const category = await prisma.category.findFirst({
      where: { code: categoryCode },
    });

    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 400 });
    }

    // Get the latest grocery code for this category
    const latestGrocery = await prisma.grocery.findFirst({
      where: {
        code: {
          startsWith: categoryCode,
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    // Generate new code
    let newCode: string;
    if (!latestGrocery) {
      newCode = `${categoryCode}AA000001`;
    } else {
      const currentCode = latestGrocery.code;
      const series = currentCode.substring(2, 4);
      const number = parseInt(currentCode.substring(4));

      if (number === 999999) {
        // Increment series (e.g., AA -> AB)
        const newSeries = String.fromCharCode(series.charCodeAt(0), series.charCodeAt(1) + 1);
        newCode = `${categoryCode}${newSeries}000001`;
      } else {
        // Increment number
        newCode = `${categoryCode}${series}${(number + 1).toString().padStart(6, '0')}`;
      }
    }

    // Create the grocery record
    const grocery = await prisma.grocery.create({
      data: {
        code: newCode,
        name,
        categoryId: category.id,
        weight,
        price,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(grocery, { status: 201 });
  } catch (error) {
    console.error('Error creating grocery:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
