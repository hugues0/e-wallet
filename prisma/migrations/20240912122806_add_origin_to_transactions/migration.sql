/*
  Warnings:

  - The values [DEBIT,CREDIT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `origin` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Origin" AS ENUM ('EWALLET', 'MOMO', 'ATMONEY', 'BPRRWRW', 'GTBIRWRK', 'ECOCRWRW', 'BRDRRWRW', 'BKIGRWRW', 'BKORRWRW');

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('INTERWALLET', 'EXTERNAL');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "origin" "Origin" NOT NULL;
