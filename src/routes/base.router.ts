import { Router, Request } from "express";
import { ServerConfig, BaseInfo } from "../types";
import { Cache } from "../services/cache";
import { discoverBases, loadCategoryMeta } from "../services/asset-scanner";

export function createBaseRouter(config: ServerConfig, cache: Cache): Router {
  const router = Router({ mergeParams: true });

  // GET /api/:project/bases
  router.get("/", (req: Request<{ project: string }>, res) => {
    const { project } = req.params;
    const cacheKey = `bases:${project}`;
    let bases = cache.get<string[]>(cacheKey);
    if (!bases) {
      bases = discoverBases(config, project);
      cache.set(cacheKey, bases);
    }
    res.json(bases);
  });

  // GET /api/:project/bases/:base
  router.get("/:base", (req: Request<{ project: string; base: string }>, res) => {
    const { project, base } = req.params;
    const cacheKey = `base:${project}:${base}`;
    let info = cache.get<BaseInfo>(cacheKey);
    if (!info) {
      const categories = loadCategoryMeta(config, project, base);
      if (categories.length === 0) {
        res.status(404).json({ error: `Base '${base}' not found in project '${project}'` });
        return;
      }
      info = { id: base, name: base.charAt(0).toUpperCase() + base.slice(1), categories };
      cache.set(cacheKey, info);
    }
    res.json(info);
  });

  return router;
}
