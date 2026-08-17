-- Move auth from roles/user_roles (RoleName) onto a users.role column.
-- Maps ADMIN_PLANNER -> ADMIN, MANAGEMENT -> SUPERVISOR (EMPLOYEE unchanged).

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR', 'EMPLOYEE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "Role";

UPDATE "users" AS u
SET "role" = CASE r.name::text
  WHEN 'ADMIN_PLANNER' THEN 'ADMIN'::"Role"
  WHEN 'PLANNER' THEN 'ADMIN'::"Role"
  WHEN 'ADMIN' THEN 'ADMIN'::"Role"
  WHEN 'MANAGEMENT' THEN 'SUPERVISOR'::"Role"
  WHEN 'SUPERVISOR' THEN 'SUPERVISOR'::"Role"
  ELSE 'EMPLOYEE'::"Role"
END
FROM "user_roles" AS ur
JOIN "roles" AS r ON r.id = ur."roleId"
WHERE ur."userId" = u.id
  AND u."role" IS NULL;

UPDATE "users" SET "role" = 'EMPLOYEE'::"Role" WHERE "role" IS NULL;

ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;

DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "roles";
DROP TYPE IF EXISTS "RoleName";

ALTER TABLE "users" DROP COLUMN IF EXISTS "displayName";
ALTER TABLE "users" DROP COLUMN IF EXISTS "isActive";
