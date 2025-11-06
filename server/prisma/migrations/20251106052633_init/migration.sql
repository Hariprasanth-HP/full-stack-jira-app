-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('task');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('feature');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'low');

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "type" "TaskType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "summary" VARCHAR(100),
    "description" VARCHAR(255),
    "assignee" VARCHAR(100) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "type" "FeatureType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "summary" VARCHAR(100),
    "description" VARCHAR(255),
    "taskIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignee" VARCHAR(100) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);
