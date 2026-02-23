import express from "express";
import cors from "cors";
import { ServerConfig } from "./types";
import { Cache } from "./services/cache";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { createManifestRouter } from "./routes/manifest.router";
import { createBaseRouter } from "./routes/base.router";
import { createCategoryRouter } from "./routes/category.router";
import { createVariantRouter, createPremadesRouter } from "./routes/variant.router";

export function createApp(config: ServerConfig): express.Express {
  const app = express();
  const cache = new Cache(config.cache.ttlSeconds);

  app.use(cors());
  app.use(express.json());

  // Static file serving for images
  app.use("/static", express.static(config.assetsBasePath));

  // Auth middleware
  app.use("/api", authMiddleware(config));

  // API routes
  app.use("/api", createManifestRouter(config, cache));
  app.use("/api/:project/bases", createBaseRouter(config, cache));
  app.use("/api/:project/bases", createCategoryRouter(config, cache));
  app.use("/api/:project/bases", createVariantRouter(config, cache));
  app.use("/api/:project/premades", createPremadesRouter(config, cache));

  // Error handler
  app.use(errorHandler);

  return app;
}
