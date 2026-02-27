import express from "express";
import path from "path";
import cors from "cors";
import compression from "compression";
import { ServerConfig } from "./types";
import { Cache } from "./services/cache";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { createManifestRouter } from "./routes/manifest.router";
import { createBaseRouter } from "./routes/base.router";
import { createCategoryRouter } from "./routes/category.router";
import { createVariantRouter, createPremadesRouter } from "./routes/variant.router";
import { createRenderRouter } from "./routes/render.router";
import { createIconRouter } from "./routes/icon.router";

export function createApp(config: ServerConfig): express.Express {
  const app = express();
  const cache = new Cache(config.cache.ttlSeconds);

  app.use(cors());
  app.use(compression());
  app.use(express.json());

  // Health check — no auth required
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Static file serving for images
  app.use("/static", express.static(config.assetsBasePath));

  // Public docs endpoint — no auth required
  app.get("/docs", (_req, res) => {
    res.type("text/markdown").sendFile(path.resolve(__dirname, "..", "docs", "API_SPEC.md"));
  });

  // Auth middleware
  app.use("/api", authMiddleware(config));

  // API routes
  app.use("/api", createManifestRouter(config, cache));
  app.use("/api/:project/bases", createBaseRouter(config, cache));
  app.use("/api/:project/bases", createCategoryRouter(config, cache));
  app.use("/api/:project/bases", createVariantRouter(config, cache));
  app.use("/api/:project/premades", createPremadesRouter(config, cache));
  app.use("/api/:project", createIconRouter(config, cache));
  app.use("/api/:project", createRenderRouter(config));

  // Error handler
  app.use(errorHandler);

  return app;
}
