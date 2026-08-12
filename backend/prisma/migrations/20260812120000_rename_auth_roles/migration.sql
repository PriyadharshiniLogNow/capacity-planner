-- Rename auth roles: PLANNER -> ADMIN, MANAGEMENT -> SUPERVISOR (EMPLOYEE unchanged)

CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'SUPERVISOR', 'EMPLOYEE');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE "role"::text
      WHEN 'PLANNER' THEN 'ADMIN'::"Role_new"
      WHEN 'MANAGEMENT' THEN 'SUPERVISOR'::"Role_new"
      WHEN 'EMPLOYEE' THEN 'EMPLOYEE'::"Role_new"
      ELSE 'EMPLOYEE'::"Role_new"
    END
  );

DROP TYPE "Role";

ALTER TYPE "Role_new" RENAME TO "Role";
