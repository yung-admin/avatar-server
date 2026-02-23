import { Request, Response, NextFunction } from "express";
import { ServerConfig } from "../types";

export function authMiddleware(config: ServerConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!config.auth.enabled) {
      next();
      return;
    }

    const fullPath = req.baseUrl + req.path;
    const isPublic = config.auth.publicEndpoints.some((pe) => {
      const [method, ...pathParts] = pe.split(" ");
      const pePath = pathParts.join(" ");
      return req.method === method && fullPath === pePath;
    });

    if (isPublic) {
      next();
      return;
    }

    const apiKey = req.headers["x-api-key"] as string || req.query.apiKey as string;

    if (!apiKey || !config.auth.apiKeys.includes(apiKey)) {
      res.status(401).json({ error: "Unauthorized. Provide a valid API key via X-API-Key header or apiKey query param." });
      return;
    }

    next();
  };
}
