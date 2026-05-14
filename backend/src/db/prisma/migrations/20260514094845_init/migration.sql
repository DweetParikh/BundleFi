-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "aum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "investorCount" INTEGER NOT NULL DEFAULT 0,
    "apy30d" DOUBLE PRECISION,
    "change7d" DOUBLE PRECISION,
    "minInvestment" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "inception" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleToken" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "BundleToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "investedUsd" DOUBLE PRECISION NOT NULL,
    "shares" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "solAmount" DOUBLE PRECISION NOT NULL,
    "usdAmount" DOUBLE PRECISION NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'invest',
    "status" TEXT NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "change24h" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_key" ON "User"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_bundleId_key" ON "Position"("userId", "bundleId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_signature_key" ON "Transaction"("signature");

-- CreateIndex
CREATE INDEX "PriceSnapshot_symbol_timestamp_idx" ON "PriceSnapshot"("symbol", "timestamp");

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleToken" ADD CONSTRAINT "BundleToken_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
