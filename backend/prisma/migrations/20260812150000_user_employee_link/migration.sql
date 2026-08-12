-- Ensure User ↔ Employee 1:1 link (idempotent for DBs that already have it)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_employeeId_key" ON "users"("employeeId");

DO $$
BEGIN
  ALTER TABLE "users"
    ADD CONSTRAINT "users_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "employees"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
