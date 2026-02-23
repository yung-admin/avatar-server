import path from "path";
import fs from "fs";
import { ServerConfig } from "./types";

export function loadConfig(): ServerConfig {
  const configPath = path.resolve(__dirname, "..", "config.json");
  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const config: ServerConfig = {
    port: parseInt(process.env.PORT || String(raw.port), 10),
    assetsBasePath: path.resolve(__dirname, "..", raw.assetsBasePath),
    imageServing: {
      mode: (process.env.IMAGE_MODE as "local" | "cdn") || raw.imageServing.mode,
      localBaseUrl: raw.imageServing.localBaseUrl,
      cdnBaseUrl: process.env.CDN_BASE_URL || raw.imageServing.cdnBaseUrl,
    },
    auth: {
      enabled: process.env.AUTH_ENABLED
        ? process.env.AUTH_ENABLED === "true"
        : raw.auth.enabled,
      apiKeys: process.env.API_KEYS
        ? process.env.API_KEYS.split(",").map((k: string) => k.trim())
        : raw.auth.apiKeys,
      publicEndpoints: raw.auth.publicEndpoints,
    },
    cache: {
      ttlSeconds: raw.cache.ttlSeconds,
    },
  };

  return config;
}
