import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, Grocery } from "@prisma/client";
import { updateMudaFinance } from "@/lib/dailySummary/mudaFinance";
import { updateMudaInventory } from "@/lib/dailySummary/mudaInventory";
import { getToday } from "@/lib/getToday";

// Define a type for the request body
type MudaPurchaseRequestBody = {
  categoryId: string;
  customerId: string;
  quantity: number;
  weight: number;
  price: number;
  isPerhiasanKita?: boolean;
  code?: string;
  tkr?: string;
  buyPrice?: number;
  sellPrice?: number;
  name?: string;
};

// Add these types at the top of the file after MudaPurchaseRequestBody
type MudaPurchaseHandlerParams = {
  tx: Prisma.TransactionClient;
  category: { id: string; code: string; name: string; [key: string]: any };
  customerId: string;
  quantity: number;
  weight: number;
  price: number;
  buyPrice?: number;
  sellPrice?: number;
  code?: string;
  tkr?: string;
  source?: string;
  name?: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "date";
    const order = searchParams.get("order") || "desc";
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minWeight = searchParams.get("minWeight");
    const maxWeight = searchParams.get("maxWeight");

    const skip = (page - 1) * limit;

    // Build where condition
    const where: Prisma.MudaIncomingItemWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (minWeight || maxWeight) {
      where.weight = {};
      if (minWeight) {
        where.weight.gte = parseFloat(minWeight);
      }
      if (maxWeight) {
        where.weight.lte = parseFloat(maxWeight);
      }
    }

    // Build orderBy
    const orderBy: Prisma.MudaIncomingItemOrderByWithRelationInput = {};
    if (sort === "date") {
      orderBy.date = order as "asc" | "desc";
    } else if (sort === "weight") {
      orderBy.weight = order as "asc" | "desc";
    } else if (sort === "price") {
      orderBy.price = order as "asc" | "desc";
    } else if (sort === "customer") {
      orderBy.customer = { name: order as "asc" | "desc" };
    } else if (sort === "category") {
      orderBy.category = { name: order as "asc" | "desc" };
    }

    const [purchases, total] = await Promise.all([
      prisma.mudaIncomingItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: true,
          category: true,
          grocery: {
            include: {
              category: true,
            },
          },
        },
      }),
      prisma.mudaIncomingItem.count({ where }),
    ]);

    return NextResponse.json({
      items: purchases,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching muda purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch muda purchases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MudaPurchaseRequestBody = await request.json();
    const {
      categoryId,
      customerId,
      quantity,
      weight,
      price,
      isPerhiasanKita,
      code,
      tkr,
      buyPrice,
      sellPrice,
      name,
    } = body;

    // Validate required fields
    if (!categoryId || !customerId || !quantity || !weight || !price) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch category and customer
    const [category, customer] = await Promise.all([
      prisma.mudaCategory.findUnique({ where: { id: categoryId } }),
      prisma.customer.findUnique({ where: { id: customerId } }),
    ]);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        if (customer.isSupplier) {
          // Supplier case - Create new muda groceries
          return await handleMudaSupplierPurchase({
            tx,
            category,
            customerId,
            quantity,
            weight,
            price,
            buyPrice,
            tkr,
            name,
          });
        } else {
          // Non-supplier case - Create muda washing items
          return await handleMudaNonSupplierPurchase({
            tx,
            category,
            customerId,
            quantity,
            weight,
            price,
            buyPrice,
            isPerhiasanKita,
            code,
            sellPrice,
            name,
          });
        }
      },
      {
        timeout: 100000, // 100 seconds timeout
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating muda purchase:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleMudaSupplierPurchase({
  tx,
  category,
  customerId,
  quantity,
  weight,
  price,
  buyPrice,
  tkr,
  name,
}: MudaPurchaseHandlerParams) {
  const groceries: Grocery[] = [];

  for (let i = 0; i < quantity; i++) {
    const code = await generateMudaGroceryCode(tx, category.code);

    // Create muda grocery
    const grocery = await tx.mudaGrocery.create({
      data: {
        code,
        name: name || `${category.name} #${i + 1}`,
        categoryId: category.id,
        tkr: tkr ? tkr.substring(0, 10) : undefined, // Ensure tkr doesn't exceed 10 chars
        weight,
        price,
      },
    });

    groceries.push(grocery);

    // Create muda incoming item record
    await tx.mudaIncomingItem.create({
      data: {
        code,
        name: name || `${category.name} #${i + 1}`,
        groceryCode: code,
        weight,
        price,
        categoryId: category.id,
        customerId,
        quantity: 1,
        buyPrice,
        source: "supplier",
      },
    });
  }

  // Update muda category counts and totals
  await tx.mudaCategory.update({
    where: { id: category.id },
    data: {
      itemCount: { increment: quantity },
      totalWeight: { increment: weight * quantity },
    },
  });

  // Update muda inventory tracking in MudaDailySummary
  await updateMudaInventory({
    weight: weight * quantity,
    quantity: quantity,
    itemType: category.name,
    action: "increase",
    tx,
    categoryId: category.id,
  });

  // Update financial records (shared with emas tua)
  await updateMudaFinance({
    amount: new Prisma.Decimal(buyPrice || price),
    action: "outgoingMoney",
    tx,
  });

  return { groceries, message: "Muda supplier purchase created successfully" };
}

async function handleMudaNonSupplierPurchase({
  tx,
  category,
  customerId,
  quantity,
  weight,
  price,
  buyPrice,
  isPerhiasanKita,
  code,
  sellPrice,
  name,
}: MudaPurchaseHandlerParams & { isPerhiasanKita?: boolean }) {
  const items = [];

  for (let i = 0; i < quantity; i++) {
    const itemCode =
      code || (await generateMudaIncomingItemCode(tx, category.code));

    // Use MudaIncomingItem table for emas muda
    const incomingItem = await tx.mudaIncomingItem.create({
      data: {
        code: itemCode,
        name: name || `${category.name} #${i + 1}`,
        weight,
        price,
        categoryId: category.id,
        customerId,
        quantity: 1,
        buyPrice,
        sellPrice,
        source: isPerhiasanKita ? "perhiasan" : "customer", // Shortened to fit 10 char limit
      },
    });

    // Create muda washing item
    await tx.mudaWashingItem.create({
      data: {
        mudaIncomingItemId: incomingItem.id,
        newCode: itemCode,
      },
    });

    items.push(incomingItem);
  }

  // Update muda inventory tracking in MudaDailySummary
  await updateMudaInventory({
    weight: weight * quantity,
    quantity: quantity,
    itemType: category.name,
    action: "increase",
    tx,
    categoryId: category.id,
  });

  // Update financial records (shared with emas tua)
  await updateMudaFinance({
    amount: new Prisma.Decimal(buyPrice || price),
    action: "outgoingMoney",
    tx,
  });

  return { items, message: "Muda non-supplier purchase created successfully" };
}

async function generateMudaGroceryCode(
  tx: Prisma.TransactionClient,
  categoryCode: string
): Promise<string> {
  // Mode prefix for emas muda is 'M'
  const modePrefix = "M";

  // Get the latest muda grocery code with muda prefix for this category
  const latestGrocery = await tx.mudaGrocery.findFirst({
    where: {
      code: {
        startsWith: `${categoryCode}${modePrefix}`,
      },
    },
    orderBy: {
      code: "desc",
    },
  });

  let newCode;
  if (!latestGrocery) {
    // Format: CNM A 00001 (10 chars total: CN + M + A + 00001)
    newCode = `${categoryCode}${modePrefix}A00001`;
  } else {
    const currentCode = latestGrocery.code;
    const series = currentCode.substring(3, 4); // Single letter series
    const number = parseInt(currentCode.substring(4)); // Number part

    if (number === 99999) {
      const newSeries = String.fromCharCode(series.charCodeAt(0) + 1);
      newCode = `${categoryCode}${modePrefix}${newSeries}00001`;
    } else {
      newCode = `${categoryCode}${modePrefix}${series}${(number + 1)
        .toString()
        .padStart(5, "0")}`;
    }
  }

  return newCode;
}

async function generateMudaIncomingItemCode(
  tx: Prisma.TransactionClient,
  categoryCode: string
): Promise<string> {
  // Mode prefix for emas muda is 'M'
  const modePrefix = "M";

  // Get the latest muda incoming item code with muda prefix for this category
  const latestItem = await tx.mudaIncomingItem.findFirst({
    where: {
      code: {
        startsWith: `${categoryCode}${modePrefix}`,
      },
    },
    orderBy: {
      code: "desc",
    },
  });

  let newCode;
  if (!latestItem) {
    // Format: CNM A 00001 (10 chars total: CN + M + A + 00001)
    newCode = `${categoryCode}${modePrefix}A00001`;
  } else {
    const currentCode = latestItem.code || `${categoryCode}${modePrefix}A00000`;
    const series = currentCode.substring(3, 4); // Single letter series
    const number = parseInt(currentCode.substring(4)); // Number part

    if (number === 99999) {
      const newSeries = String.fromCharCode(series.charCodeAt(0) + 1);
      newCode = `${categoryCode}${modePrefix}${newSeries}00001`;
    } else {
      newCode = `${categoryCode}${modePrefix}${series}${(number + 1)
        .toString()
        .padStart(5, "0")}`;
    }
  }

  return newCode;
}
