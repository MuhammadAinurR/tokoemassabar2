import { PrismaClient, Prisma } from "@prisma/client";
import { getToday } from "../getToday";
const prisma = new PrismaClient();

type InventoryAction = "increase" | "decrease" | "destroy";

interface UpdateInventoryParams {
  weight: number;
  quantity: number;
  itemType: string;
  action: InventoryAction;
  tx?: Prisma.TransactionClient;
  categoryId?: string;
}

// Add mapping for Indonesian to English terms
const itemTypeMapping: Record<string, string> = {
  cincin: "ring",
  anting: "earring",
  kalung: "necklace",
  gelang: "bracelet",
  liontin: "pendant",
  giwang: "studEarring",
};

// Add a type for the DailySummary fields
type DailySummaryFields = {
  [key: string]: number | Prisma.Decimal | Date | null;
};

export async function updateInventory({ weight, quantity, itemType, action, tx, categoryId }: UpdateInventoryParams) {
  const value = action === "increase" ? 1 : -1;

  // Convert Indonesian term to English if needed
  const normalizedItemType = itemTypeMapping[itemType.toLowerCase()] || itemType;

  // Validate itemType after normalization
  if (!["ring", "earring", "necklace", "bracelet", "pendant", "studEarring"].includes(normalizedItemType)) {
    throw new Error(`Invalid item type: ${itemType}`);
  }

  const today = getToday();

  // Ensure we're only looking at the current day's summary for nonSale actions
  const currentSummary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  // Modify the previousSummary lookup to always get the last record
  // regardless of action type
  const previousSummary = await prisma.dailySummary.findFirst({
    orderBy: { date: "desc" },
    where: { date: { lt: today } },
  });

  // Modify how we determine increase/decrease behavior
  const isIncrease = action === "increase";
  const modifier = action === "destroy" ? -1 : isIncrease ? 1 : -1;

  // Build dynamic field names based on itemType and action
  const totalWeightField = `total${normalizedItemType.charAt(0).toUpperCase() + normalizedItemType.slice(1)}Weight`;
  const totalQtyField = `total${normalizedItemType.charAt(0).toUpperCase() + normalizedItemType.slice(1)}Qty`;
  const movementPrefix = action === "destroy" ? "nonSale" : isIncrease ? "incoming" : "outgoing";

  const dailySummary = await prisma.dailySummary.upsert({
    where: { date: today },
    create: {
      date: today,
      // Initialize all required fields with default values
      totalRingWeight: new Prisma.Decimal(0),
      totalEarringWeight: new Prisma.Decimal(0),
      totalNecklaceWeight: new Prisma.Decimal(0),
      totalBraceletWeight: new Prisma.Decimal(0),
      totalPendantWeight: new Prisma.Decimal(0),
      totalStudEarringWeight: new Prisma.Decimal(0),
      totalRingQty: 0,
      totalEarringQty: 0,
      totalNecklaceQty: 0,
      totalBraceletQty: 0,
      totalPendantQty: 0,
      totalStudEarringQty: 0,
      // Then override the specific field we're updating
      [totalWeightField]: new Prisma.Decimal(
        (
          (currentSummary?.[totalWeightField as keyof typeof currentSummary] as unknown as Prisma.Decimal) ||
          (previousSummary?.[totalWeightField as keyof typeof previousSummary] as unknown as Prisma.Decimal)
        )?.toString() ?? "0"
      )[action === "destroy" ? "sub" : isIncrease ? "add" : "sub"](weight),
      [totalQtyField]:
        ((currentSummary?.[totalQtyField as keyof typeof currentSummary] as number) ??
          (previousSummary?.[totalQtyField as keyof typeof previousSummary] as number) ??
          0) +
        quantity * modifier,
      [`${movementPrefix}${normalizedItemType.charAt(0).toUpperCase() + normalizedItemType.slice(1)}Weight`]: weight,
      [`${movementPrefix}${normalizedItemType.charAt(0).toUpperCase() + normalizedItemType.slice(1)}Qty`]: quantity,
      [`${movementPrefix}TotalWeight`]: weight,
      [`${movementPrefix}TotalQty`]: quantity,
      grandTotalWeight: new Prisma.Decimal(previousSummary?.grandTotalWeight ?? 0)[isIncrease ? "add" : "sub"](weight),
      grandTotalQty: (previousSummary?.grandTotalQty ?? 0) + quantity * modifier,
      // Copy all other totals from previous day
      ...Object.entries(previousSummary || {}).reduce((acc, [key, value]) => {
        if (key.startsWith("total") && key !== totalWeightField && key !== totalQtyField) {
          acc[key] = value as number | Prisma.Decimal | Date | null;
        }
        return acc;
      }, {} as DailySummaryFields),
    },
    update: {
      [totalWeightField]: { [action === "destroy" ? "decrement" : isIncrease ? "increment" : "decrement"]: weight },
      [totalQtyField]: { [action === "destroy" ? "decrement" : isIncrease ? "increment" : "decrement"]: quantity },
      [`${movementPrefix}${normalizedItemType.charAt(0).toUpperCase() + normalizedItemType.slice(1)}Weight`]: {
        increment: weight,
      },
      [`${movementPrefix}${normalizedItemType.charAt(0).toUpperCase() + normalizedItemType.slice(1)}Qty`]: {
        increment: quantity,
      },
      [`${movementPrefix}TotalWeight`]: { increment: weight },
      [`${movementPrefix}TotalQty`]: { increment: quantity },
      grandTotalWeight: currentSummary
        ? { [isIncrease ? "increment" : "decrement"]: weight }
        : {
            set: new Prisma.Decimal(previousSummary?.grandTotalWeight ?? 0)[isIncrease ? "add" : "sub"](weight),
          },
      grandTotalQty: currentSummary
        ? { [isIncrease ? "increment" : "decrement"]: quantity }
        : { set: (previousSummary?.grandTotalQty ?? 0) + quantity * modifier },
    },
  });

  // Update category totals if categoryId and tx are provided
  if (categoryId && tx) {
    await tx.category.update({
      where: { id: categoryId },
      data: {
        itemCount: { increment: quantity * value },
        totalWeight: { increment: weight * value },
      },
    });
  }

  return dailySummary;
}

// Example usage:
// Add necklace (increases category totals)
// await updateInventory({
//   weight: 5.0,
//   quantity: 1,
//   itemType: 'necklace',
//   action: 'increase',
//   categoryId: 'cat123',
//   tx: prismaTransaction
// })

// Remove pendant through sale (decreases category totals)
// await updateInventory({
//   weight: 3.0,
//   quantity: 1,
//   itemType: 'pendant',
//   action: 'decrease',
//   categoryId: 'cat123',
//   tx: prismaTransaction
// })

// Remove ring through damage/loss (also decreases category totals)
// await updateInventory({
//   weight: 2.0,
//   quantity: 1,
//   itemType: 'ring',
//   action: 'destroy',
//   categoryId: 'cat123',
//   tx: prismaTransaction
// })
