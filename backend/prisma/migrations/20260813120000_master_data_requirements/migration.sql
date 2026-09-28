-- Master data requirements: required customer, date/hours checks.
-- Unique constraints on employeeCode and projectCode already exist from init.

-- Preserve existing rows: internal/missing customers become "Log Now".
UPDATE "projects"
SET "customerName" = 'Log Now'
WHERE "customerName" IS NULL OR btrim("customerName") = '';

ALTER TABLE "projects" ALTER COLUMN "customerName" SET NOT NULL;

-- Reject invalid contract hours and inverted date ranges at the database layer.
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_weekly_hours_positive";
ALTER TABLE "employees" ADD CONSTRAINT "employees_weekly_hours_positive" CHECK ("weeklyHours" > 0);

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_dates_valid";
ALTER TABLE "employees" ADD CONSTRAINT "employees_dates_valid" CHECK ("endDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_dates_valid";
ALTER TABLE "projects" ADD CONSTRAINT "projects_dates_valid" CHECK ("endDate" >= "startDate");
