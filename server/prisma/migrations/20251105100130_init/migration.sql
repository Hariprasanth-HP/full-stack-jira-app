-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('story', 'task');

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

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);
