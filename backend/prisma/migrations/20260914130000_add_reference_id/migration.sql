-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "referenceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_referenceId_key" ON "Transaction"("userId", "referenceId");
