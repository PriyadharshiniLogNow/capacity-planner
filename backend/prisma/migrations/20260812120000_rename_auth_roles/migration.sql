-- Convert join-table RBAC (RoleName) to a single User.role enum.
-- ADMIN_PLANNER -> ADMIN, MANAGEMENT -> SUPERVISOR, EMPLOYEE -> EMPLOYEE

CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR', 'EMPLOYEE');

ALTER TABLE "users" ADD COLUMN "role" "Role";

UPDATE "users" u
SET "role" = mapped.role
FROM (
  SELECT DISTINCT ON (ur."userId")
    ur."userId",
    CASE r.name::text
      WHEN 'ADMIN_PLANNER' THEN 'ADMIN'::"Role"
      WHEN 'MANAGEMENT' THEN 'SUPERVISOR'::"Role"
      WHEN 'EMPLOYEE' THEN 'EMPLOYEE'::"Role"
      ELSE 'EMPLOYEE'::"Role"
    END AS role
  FROM "user_roles" ur
  JOIN "roles" r ON r.id = ur."roleId"
  ORDER BY
    ur."userId",
    CASE r.name::text
      WHEN 'ADMIN_PLANNER' THEN 1
      WHEN 'MANAGEMENT' THEN 2
      ELSE 3
    END
) mapped
WHERE mapped."userId" = u.id;

UPDATE "users"
SET "role" = 'EMPLOYEE'::"Role"
WHERE "role" IS NULL;

ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;

DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "roles";
DROP TYPE IF EXISTS "RoleName";

ALTER TABLE "users" DROP COLUMN IF EXISTS "displayName";
ALTER TABLE "users" DROP COLUMN IF EXISTS "isActive";
