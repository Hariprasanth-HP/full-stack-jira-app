/*
  Warnings:

  - You are about to drop the column `taskIds` on the `features` table. All the data in the column will be lost.
  - Added the required column `featureId` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "features" DROP COLUMN "taskIds";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "featureId" INTEGER NOT NULL;
