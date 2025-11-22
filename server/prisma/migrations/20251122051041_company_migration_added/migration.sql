/*
  Warnings:

  - Added the required column `creatorId` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "creatorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
