-- AlterTable
ALTER TABLE "capacity_plans" ADD COLUMN IF NOT EXISTS "dailyHours" JSONB;
