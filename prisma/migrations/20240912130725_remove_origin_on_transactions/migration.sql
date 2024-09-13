/*
  Warnings:

  - You are about to drop the column `origin` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "origin";

-- DropEnum
DROP TYPE "Origin";
