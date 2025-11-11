/*
  Warnings:

  - Added the required column `creatorId` to the `Bug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Epic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Story` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Bug" ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "Epic" ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "Bug_creatorId_idx" ON "Bug"("creatorId");

-- CreateIndex
CREATE INDEX "Epic_creatorId_idx" ON "Epic"("creatorId");

-- CreateIndex
CREATE INDEX "Story_creatorId_idx" ON "Story"("creatorId");

-- CreateIndex
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");
