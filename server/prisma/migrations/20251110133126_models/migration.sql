/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Bug` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Epic` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Task` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Bug_creatorId_idx";

-- DropIndex
DROP INDEX "public"."Epic_creatorId_idx";

-- DropIndex
DROP INDEX "public"."Story_creatorId_idx";

-- DropIndex
DROP INDEX "public"."Task_creatorId_idx";

-- AlterTable
ALTER TABLE "Bug" DROP COLUMN "creatorId",
ADD COLUMN     "creator" TEXT;

-- AlterTable
ALTER TABLE "Epic" DROP COLUMN "creatorId",
ADD COLUMN     "creator" TEXT;

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "creatorId",
ADD COLUMN     "creator" TEXT;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "creatorId",
ADD COLUMN     "creator" TEXT;

-- CreateIndex
CREATE INDEX "Bug_creator_idx" ON "Bug"("creator");

-- CreateIndex
CREATE INDEX "Epic_creator_idx" ON "Epic"("creator");

-- CreateIndex
CREATE INDEX "Story_creator_idx" ON "Story"("creator");

-- CreateIndex
CREATE INDEX "Task_creator_idx" ON "Task"("creator");
