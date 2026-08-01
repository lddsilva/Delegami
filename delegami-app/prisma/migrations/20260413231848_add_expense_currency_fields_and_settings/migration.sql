-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN "accountantEmail" TEXT;
ALTER TABLE "company_settings" ADD COLUMN "registrationNumber" TEXT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "amountChf" REAL;
ALTER TABLE "expenses" ADD COLUMN "exchangeRate" REAL;
