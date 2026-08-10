import "../config/env";
import { connectDatabase, disconnectDatabase, prisma } from "../lib/prisma";
import { checkDatabaseConnection } from "../db/health";

async function main() {
  console.log("Connecting to database...");
  await connectDatabase();

  const health = await checkDatabaseConnection();
  if (!health.ok) {
    console.error("Database health check failed:", health.error);
    process.exitCode = 1;
    return;
  }

  const [employees, projects, users] = await Promise.all([
    prisma.employee.count(),
    prisma.project.count(),
    prisma.user.count(),
  ]);

  console.log(`Database OK (${health.latencyMs}ms)`);
  console.log(`  users: ${users}`);
  console.log(`  employees: ${employees}`);
  console.log(`  projects: ${projects}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
