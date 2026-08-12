import express from "express";
import cors from "cors";
import { connectDatabase, disconnectDatabase } from "./lib/prisma";
import { apiRoutes } from "./routes";


const port = Number(process.env.PORT ?? 4000);

async function bootstrap() {
  await connectDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api", apiRoutes);

  const server = app.listen(port, () => {
    console.log(`API listening on ${port}`);
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
