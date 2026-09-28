-- Rename org hierarchy Manager -> Supervisor without dropping rows.
-- Existing managerId values are copied in place via RENAME COLUMN.

ALTER TABLE "employees" RENAME COLUMN "managerId" TO "supervisorId";

ALTER INDEX "employees_managerId_idx" RENAME TO "employees_supervisorId_idx";

ALTER TABLE "employees" RENAME CONSTRAINT "employees_managerId_fkey" TO "employees_supervisorId_fkey";

-- First-employee bootstrap used a self-manager. That is no longer allowed.
-- Real supervisor relationships (A -> B where A <> B) are preserved.
UPDATE "employees"
SET "supervisorId" = NULL
WHERE "supervisorId" IS NOT NULL
  AND "supervisorId" = "id";

-- Email is employee master data, not a login credential.
-- Backfill from linked user accounts; do not touch users.passwordHash.
ALTER TABLE "employees" ADD COLUMN "email" TEXT;

UPDATE "employees" AS e
SET "email" = u.email
FROM "users" AS u
WHERE u."employeeId" = e.id
  AND e."email" IS NULL;

UPDATE "employees"
SET "email" = 'migrated-' || id || '@employees.local'
WHERE "email" IS NULL;

ALTER TABLE "employees" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
