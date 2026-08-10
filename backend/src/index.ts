import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./lib/prisma";
import { checkDatabaseConnection } from "./db/health";
import express from "express";
import cors from "cors";

async function bootstrap() {
  await connectDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", async (_req, res) => {
    const db = await checkDatabaseConnection();
    res.status(db.ok ? 200 : 503).json({
      status: db.ok ? "ok" : "degraded",
      database: db,
    });
  });

  const server = app.listen(env.port, () => {
    console.log(`API listening on ${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch(async (error) => {
  console.error("Failed to start API:", error);
  await disconnectDatabase();
  process.exit(1);
});
