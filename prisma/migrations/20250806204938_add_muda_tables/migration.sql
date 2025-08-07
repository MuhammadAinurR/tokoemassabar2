-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "minimumPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Finance" ADD COLUMN     "storeClosingBalance" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "Operational" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operational_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MudaCategory" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(7) NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "goldContent" TEXT NOT NULL,
    "minimumPrice" DOUBLE PRECISION,

    CONSTRAINT "MudaCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MudaGrocery" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tkr" VARCHAR(10),
    "weight" DECIMAL(10,3) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MudaGrocery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MudaIncomingItem" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10),
    "name" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groceryCode" TEXT,
    "weight" DECIMAL(10,3),
    "price" DECIMAL(12,2),
    "categoryId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "buyPrice" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" VARCHAR(10),
    "sellPrice" DECIMAL(12,2),

    CONSTRAINT "MudaIncomingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MudaOutgoingItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groceryCode" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sellPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "MudaOutgoingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MudaWashingItem" (
    "id" TEXT NOT NULL,
    "mudaIncomingItemId" TEXT NOT NULL,
    "newCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isWashed" BOOLEAN NOT NULL DEFAULT false,
    "washedAt" TIMESTAMP(3),

    CONSTRAINT "MudaWashingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MudaMeltedItem" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" VARCHAR(10),
    "categoryId" TEXT NOT NULL,
    "weight" DECIMAL(10,3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MudaMeltedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MudaDailySummary" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incomingRingWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "incomingRingQty" INTEGER NOT NULL DEFAULT 0,
    "outgoingRingWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "outgoingRingQty" INTEGER NOT NULL DEFAULT 0,
    "nonSaleRingWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "nonSaleRingQty" INTEGER NOT NULL DEFAULT 0,
    "totalRingWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "totalRingQty" INTEGER NOT NULL DEFAULT 0,
    "incomingEarringWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "incomingEarringQty" INTEGER NOT NULL DEFAULT 0,
    "outgoingEarringWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "outgoingEarringQty" INTEGER NOT NULL DEFAULT 0,
    "nonSaleEarringWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "nonSaleEarringQty" INTEGER NOT NULL DEFAULT 0,
    "totalEarringWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "totalEarringQty" INTEGER NOT NULL DEFAULT 0,
    "incomingNecklaceWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "incomingNecklaceQty" INTEGER NOT NULL DEFAULT 0,
    "outgoingNecklaceWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "outgoingNecklaceQty" INTEGER NOT NULL DEFAULT 0,
    "nonSaleNecklaceWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "nonSaleNecklaceQty" INTEGER NOT NULL DEFAULT 0,
    "totalNecklaceWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "totalNecklaceQty" INTEGER NOT NULL DEFAULT 0,
    "incomingBraceletWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "incomingBraceletQty" INTEGER NOT NULL DEFAULT 0,
    "outgoingBraceletWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "outgoingBraceletQty" INTEGER NOT NULL DEFAULT 0,
    "nonSaleBraceletWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "nonSaleBraceletQty" INTEGER NOT NULL DEFAULT 0,
    "totalBraceletWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "totalBraceletQty" INTEGER NOT NULL DEFAULT 0,
    "incomingPendantWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "incomingPendantQty" INTEGER NOT NULL DEFAULT 0,
    "outgoingPendantWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "outgoingPendantQty" INTEGER NOT NULL DEFAULT 0,
    "nonSalePendantWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "nonSalePendantQty" INTEGER NOT NULL DEFAULT 0,
    "totalPendantWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "totalPendantQty" INTEGER NOT NULL,
    "incomingStudEarringWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "incomingStudEarringQty" INTEGER NOT NULL DEFAULT 0,
    "outgoingStudEarringWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "outgoingStudEarringQty" INTEGER NOT NULL DEFAULT 0,
    "nonSaleStudEarringWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "nonSaleStudEarringQty" INTEGER NOT NULL DEFAULT 0,
    "totalStudEarringWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "totalStudEarringQty" INTEGER NOT NULL DEFAULT 0,
    "incomingTotalWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "incomingTotalQty" INTEGER NOT NULL DEFAULT 0,
    "outgoingTotalWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "outgoingTotalQty" INTEGER NOT NULL DEFAULT 0,
    "nonSaleTotalWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "nonSaleTotalQty" INTEGER NOT NULL DEFAULT 0,
    "grandTotalWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "grandTotalQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MudaDailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MudaGrocery_code_key" ON "MudaGrocery"("code");

-- CreateIndex
CREATE INDEX "MudaGrocery_categoryId_idx" ON "MudaGrocery"("categoryId");

-- CreateIndex
CREATE INDEX "MudaIncomingItem_groceryCode_idx" ON "MudaIncomingItem"("groceryCode");

-- CreateIndex
CREATE INDEX "MudaIncomingItem_date_idx" ON "MudaIncomingItem"("date");

-- CreateIndex
CREATE INDEX "MudaIncomingItem_categoryId_idx" ON "MudaIncomingItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MudaOutgoingItem_code_key" ON "MudaOutgoingItem"("code");

-- CreateIndex
CREATE INDEX "MudaOutgoingItem_groceryCode_idx" ON "MudaOutgoingItem"("groceryCode");

-- CreateIndex
CREATE INDEX "MudaOutgoingItem_categoryId_idx" ON "MudaOutgoingItem"("categoryId");

-- CreateIndex
CREATE INDEX "MudaWashingItem_mudaIncomingItemId_idx" ON "MudaWashingItem"("mudaIncomingItemId");

-- CreateIndex
CREATE INDEX "MudaMeltedItem_date_idx" ON "MudaMeltedItem"("date");

-- CreateIndex
CREATE INDEX "MudaMeltedItem_categoryId_idx" ON "MudaMeltedItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MudaDailySummary_date_key" ON "MudaDailySummary"("date");

-- CreateIndex
CREATE INDEX "MudaDailySummary_date_idx" ON "MudaDailySummary"("date");

-- AddForeignKey
ALTER TABLE "MudaGrocery" ADD CONSTRAINT "MudaGrocery_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MudaCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudaIncomingItem" ADD CONSTRAINT "MudaIncomingItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MudaCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudaIncomingItem" ADD CONSTRAINT "MudaIncomingItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudaIncomingItem" ADD CONSTRAINT "MudaIncomingItem_groceryCode_fkey" FOREIGN KEY ("groceryCode") REFERENCES "MudaGrocery"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudaOutgoingItem" ADD CONSTRAINT "MudaOutgoingItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MudaCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudaOutgoingItem" ADD CONSTRAINT "MudaOutgoingItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudaOutgoingItem" ADD CONSTRAINT "MudaOutgoingItem_groceryCode_fkey" FOREIGN KEY ("groceryCode") REFERENCES "MudaGrocery"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudaWashingItem" ADD CONSTRAINT "MudaWashingItem_mudaIncomingItemId_fkey" FOREIGN KEY ("mudaIncomingItemId") REFERENCES "MudaIncomingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudaMeltedItem" ADD CONSTRAINT "MudaMeltedItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MudaCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
