-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'staff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(7) NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "goldContent" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "idNumber" TEXT,
    "address" TEXT NOT NULL,
    "phoneNumber" VARCHAR(15),
    "isSupplier" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grocery" (
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

    CONSTRAINT "Grocery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomingItem" (
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

    CONSTRAINT "IncomingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutgoingItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groceryCode" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sellPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OutgoingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemName" VARCHAR(50) NOT NULL,
    "itemType" VARCHAR(50) NOT NULL,
    "goldContent" DECIMAL(4,2) NOT NULL,
    "weight" DECIMAL(10,3) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WashingItem" (
    "id" TEXT NOT NULL,
    "incomingItemId" TEXT NOT NULL,
    "newCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isWashed" BOOLEAN NOT NULL DEFAULT false,
    "washedAt" TIMESTAMP(3),

    CONSTRAINT "WashingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
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

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finance" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outgoingItems" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "incomingMoney" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "incomingItems" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outgoingMoney" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalExpense" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeltedItem" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" VARCHAR(10),
    "categoryId" TEXT NOT NULL,
    "weight" DECIMAL(10,3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeltedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryService" (
    "id" TEXT NOT NULL,
    "customer" VARCHAR(50) NOT NULL,
    "phoneNumber" VARCHAR(15),
    "address" TEXT,
    "jewelryName" VARCHAR(50),
    "weight" DECIMAL(10,3),
    "description" TEXT NOT NULL,
    "ongkos" DECIMAL(12,2),
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeburHistory" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeburHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Grocery_code_key" ON "Grocery"("code");

-- CreateIndex
CREATE INDEX "Grocery_categoryId_idx" ON "Grocery"("categoryId");

-- CreateIndex
CREATE INDEX "IncomingItem_groceryCode_idx" ON "IncomingItem"("groceryCode");

-- CreateIndex
CREATE INDEX "IncomingItem_date_idx" ON "IncomingItem"("date");

-- CreateIndex
CREATE INDEX "IncomingItem_categoryId_idx" ON "IncomingItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "OutgoingItem_code_key" ON "OutgoingItem"("code");

-- CreateIndex
CREATE INDEX "OutgoingItem_groceryCode_idx" ON "OutgoingItem"("groceryCode");

-- CreateIndex
CREATE INDEX "OutgoingItem_categoryId_idx" ON "OutgoingItem"("categoryId");

-- CreateIndex
CREATE INDEX "Service_date_customerId_idx" ON "Service"("date", "customerId");

-- CreateIndex
CREATE INDEX "WashingItem_incomingItemId_idx" ON "WashingItem"("incomingItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_date_key" ON "DailySummary"("date");

-- CreateIndex
CREATE INDEX "DailySummary_date_idx" ON "DailySummary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Finance_date_key" ON "Finance"("date");

-- CreateIndex
CREATE INDEX "Finance_date_idx" ON "Finance"("date");

-- CreateIndex
CREATE INDEX "MeltedItem_date_idx" ON "MeltedItem"("date");

-- CreateIndex
CREATE INDEX "MeltedItem_categoryId_idx" ON "MeltedItem"("categoryId");

-- CreateIndex
CREATE INDEX "GroceryService_createdAt_idx" ON "GroceryService"("createdAt");

-- AddForeignKey
ALTER TABLE "Grocery" ADD CONSTRAINT "Grocery_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingItem" ADD CONSTRAINT "IncomingItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingItem" ADD CONSTRAINT "IncomingItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingItem" ADD CONSTRAINT "IncomingItem_groceryCode_fkey" FOREIGN KEY ("groceryCode") REFERENCES "Grocery"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutgoingItem" ADD CONSTRAINT "OutgoingItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutgoingItem" ADD CONSTRAINT "OutgoingItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutgoingItem" ADD CONSTRAINT "OutgoingItem_groceryCode_fkey" FOREIGN KEY ("groceryCode") REFERENCES "Grocery"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WashingItem" ADD CONSTRAINT "WashingItem_incomingItemId_fkey" FOREIGN KEY ("incomingItemId") REFERENCES "IncomingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeltedItem" ADD CONSTRAINT "MeltedItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
