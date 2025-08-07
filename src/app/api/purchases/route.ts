import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, Grocery } from "@prisma/client";
import { updateInventory } from "@/lib/dailySummary/inventory";
import { updateFinance } from "@/lib/dailySummary/finance";
import { getToday } from "@/lib/getToday";

// Define a type for the request body
type PurchaseRequestBody = {
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

// Add these types at the top of the file after PurchaseRequestBody
type PurchaseHandlerParams = {
  tx: Prisma.TransactionClient;
  category: Prisma.CategoryCreateInput;
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

type NonSupplierPurchaseParams = PurchaseHandlerParams & {
  isPerhiasanKita?: boolean;
  code?: string;
  source?: string;
  name?: string;
};

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const sort = searchParams.get("sort") || "date";
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const minWeight = searchParams.get("minWeight");
  const maxWeight = searchParams.get("maxWeight");
  const source = searchParams.get("source");
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    let where: any = {
      source: { not: "washing" },
      // Filter out muda codes (codes that start with category code + M pattern)
      NOT: {
        OR: [
          { code: { startsWith: "CNM" } },
          { code: { startsWith: "ACM" } },
          { code: { startsWith: "BRM" } },
          { code: { startsWith: "AKM" } },
          { code: { startsWith: "SBM" } },
        ],
      },
    };

    // Add source filter
    if (source && source !== "semua") {
      where.source = source === "customer" ? "customer" : "supplier";
    }

    // Existing search filter logic
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
        {
          customer: {
            name: { contains: search, mode: "insensitive" as Prisma.QueryMode },
          },
        },
        {
          category: {
            name: { contains: search, mode: "insensitive" as Prisma.QueryMode },
          },
        },
        { code: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
      ];
    }

    // Add date filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Add weight filter
    if (minWeight || maxWeight) {
      where.OR = [
        // Check weight in incomingItem (for customer purchases)
        {
          weight: {
            ...(minWeight && { gte: parseFloat(minWeight) }),
            ...(maxWeight && { lte: parseFloat(maxWeight) }),
          },
        },
        // Check weight in grocery relation (for supplier purchases)
        {
          grocery: {
            weight: {
              ...(minWeight && { gte: parseFloat(minWeight) }),
              ...(maxWeight && { lte: parseFloat(maxWeight) }),
            },
          },
        },
      ];
    }

    // Handle nested sorting
    /* eslint-disable */
    const orderBy: Prisma.IncomingItemOrderByWithRelationInput = {};
    if (sort.includes(".")) {
      const [parent, child, grandchild] = sort.split(".");
      if (grandchild) {
        // Handle deeply nested sorting (e.g., grocery.category.name)
        orderBy[parent as keyof Prisma.IncomingItemOrderByWithRelationInput] = {
          [child]: {
            [grandchild]: order as Prisma.SortOrder,
          },
        } as any;
      } else {
        // Handle single-level nested sorting (e.g., customer.name)
        orderBy[parent as keyof Prisma.IncomingItemOrderByWithRelationInput] = {
          [child]: order as Prisma.SortOrder,
        } as any;
      }
    } else {
      // Handle direct field sorting
      orderBy[sort as keyof Prisma.IncomingItemOrderByWithRelationInput] =
        order as Prisma.SortOrder;
    }
    /* eslint-enable */

    const [purchases, total] = await Promise.all([
      prisma.incomingItem.findMany({
        where,
        include: {
          customer: true,
          category: true,
          grocery: {
            include: {
              category: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.incomingItem.count({ where }),
    ]);

    return NextResponse.json({
      items: purchases,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    categoryId,
    customerId,
    quantity,
    weight,
    price,
    buyPrice,
    isPerhiasanKita,
    code,
    tkr,
    sellPrice,
    name,
  } = body as PurchaseRequestBody;
  try {
    // Check if customer is a supplier
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 400 }
      );
    }

    // Add check for duplicate purchases if code exists
    if (code) {
      const existingPurchases = await prisma.incomingItem.count({
        where: {
          code: code,
        },
      });
      if (existingPurchases >= 2) {
        return NextResponse.json(
          {
            message:
              "Barang ini sudah dibeli sebelumnya. Tidak dapat melakukan pembelian kembali.",
            type: "error",
          },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, code: true, goldContent: true },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        if (customer.isSupplier) {
          // Supplier case - Create new groceries
          return await handleSupplierPurchase({
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
          // Non-supplier case - Create washing items
          return await handleNonSupplierPurchase({
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
        timeout: 1000000, // Increase the timeout to 10 seconds
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleSupplierPurchase({
  tx,
  category,
  customerId,
  quantity,
  weight,
  price,
  buyPrice,
  tkr,
  name,
}: PurchaseHandlerParams) {
  const groceries = [];
  const incomingItems = [];

  // Find latest grocery code once before the loop
  const latestGrocery = await tx.grocery.findFirst({
    where: { code: { startsWith: category.code } },
    orderBy: { code: "desc" },
  });

  for (let i = 0; i < quantity; i++) {
    const groceryCode = generateGroceryCode(
      category.code,
      latestGrocery,
      i,
      groceries
    );

    // Create grocery and incoming item in sequence
    if (!category.id) {
      throw new Error("Category ID is undefined");
    }
    const grocery = await tx.grocery.create({
      data: {
        code: groceryCode,
        categoryId: category.id,
        weight,
        price: price || 0,
        tkr: tkr ? tkr.substring(0, 10) : "",
        name: name || "",
      },
    });
    groceries.push(grocery);

    const incomingItem = await tx.incomingItem.create({
      data: {
        code: grocery.code,
        name: name || "",
        groceryCode: grocery.code,
        categoryId: category.id,
        customerId,
        quantity: 1,
        buyPrice,
        date: getToday(),
        source: "supplier",
      },
      include: {
        grocery: { include: { category: true } },
        customer: true,
        category: true,
      },
    });
    incomingItems.push(incomingItem);
  }

  // Add inventory update
  await updateInventory({
    weight: weight * quantity,
    quantity,
    itemType: category.name.toLowerCase(),
    action: "increase",
    tx,
    categoryId: category.id,
  });

  // Update finance: record incoming items weight
  await updateFinance({
    amount: new Prisma.Decimal(+weight * quantity),
    action: "incomingItems",
    tx,
  });

  // Update finance: record outgoing money (payment to supplier)
  await updateFinance({
    amount: new Prisma.Decimal(price * quantity),
    action: "outgoingMoney",
    tx,
  });

  return incomingItems;
}

async function handleNonSupplierPurchase({
  tx,
  category,
  customerId,
  weight,
  price,
  buyPrice,
  code,
  sellPrice,
  name,
}: NonSupplierPurchaseParams) {
  const incomingItems = [];

  if (!category.id) {
    throw new Error("Category ID is undefined");
  }
  const incomingItemData = {
    categoryId: category.id,
    customerId,
    quantity: 1,
    buyPrice,
    weight,
    price,
    code: code ?? null,
    date: getToday(),
    groceryCode: code ?? null,
    sellPrice: code ? sellPrice : null,
    name,
  };
  const incomingItem = await tx.incomingItem.create({
    data: {
      ...incomingItemData,
      name: incomingItemData.name || "",
      source: "customer",
    },
    include: {
      grocery: { include: { category: true } },
    },
  });

  // Create washing item immediately after creating incoming item if there is no code there
  await tx.washingItem.create({
    data: {
      incomingItemId: incomingItem.id,
    },
  });

  incomingItems.push(incomingItem);

  // Find the grocery by code only if code is provided
  let grocery;
  if (code) {
    grocery = await tx.grocery.findUnique({
      where: { code: code },
    });
  } else {
    // Handle the case where code is not provided
    // For example, you can set grocery to null or handle it as needed
    grocery = null; // or any default value you want
  }

  // Continue with the rest of your logic
  const groceryWeight = grocery ? grocery.weight : weight; // Use the weight from grocery if it exists

  // Update finance: record incoming items weight
  await updateFinance({
    amount: new Prisma.Decimal(groceryWeight),
    action: "incomingItems",
    tx,
  });

  // Update finance: record outgoing money (payment to customer)
  await updateFinance({
    amount: new Prisma.Decimal(code ? buyPrice ?? price : price),
    action: "outgoingMoney",
    tx,
  });

  return incomingItems;
}

// Helper functions
function generateGroceryCode(
  categoryCode: string,
  latestGrocery: Grocery | null,
  index: number,
  groceries: Grocery[]
) {
  // Mode prefix for emas tua (regular purchases) is 'T'
  const modePrefix = "T";

  if (!latestGrocery && index === 0) {
    return `${categoryCode}${modePrefix}AA00001`;
  }

  const currentCode =
    (index === 0 ? latestGrocery?.code : groceries[index - 1].code) ||
    `${categoryCode}${modePrefix}AA00000`;

  // Check if current code has the same mode prefix
  const currentModePrefix = currentCode.substring(2, 3);
  const series = currentCode.substring(3, 5); // Two letter series (AA, AB, AC, etc.)
  const number = parseInt(currentCode.substring(5)); // Number part starts at position 5

  if (currentModePrefix === modePrefix) {
    // Same mode, increment normally
    if (number === 99999) {
      // Increment the series (AA -> AB, AB -> AC, etc.)
      const firstChar = series.charAt(0);
      const secondChar = series.charAt(1);

      if (secondChar === "Z") {
        // If second char is Z, increment first char and reset second to A
        const newFirstChar = String.fromCharCode(firstChar.charCodeAt(0) + 1);
        return `${categoryCode}${modePrefix}${newFirstChar}A00001`;
      } else {
        // Otherwise just increment the second character
        const newSecondChar = String.fromCharCode(secondChar.charCodeAt(0) + 1);
        return `${categoryCode}${modePrefix}${firstChar}${newSecondChar}00001`;
      }
    }
    return `${categoryCode}${modePrefix}${series}${(number + 1)
      .toString()
      .padStart(5, "0")}`;
  } else {
    // Different mode, start fresh
    return `${categoryCode}${modePrefix}AA00001`;
  }
}
