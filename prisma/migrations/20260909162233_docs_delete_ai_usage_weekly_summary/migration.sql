-- AlterTable
ALTER TABLE "Project" ADD COLUMN "lastWeeklySummary" TEXT;
ALTER TABLE "Project" ADD COLUMN "lastWeeklySummaryAt" DATETIME;

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageLog_day_key" ON "AiUsageLog"("day");
