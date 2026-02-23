import { Router, Request } from "express";
import { ServerConfig, VariantDetail, PremadeItem } from "../types";
import { Cache } from "../services/cache";
import { loadVariants, loadSingleVariant, loadPremades } from "../services/trait-loader";

export function createVariantRouter(config: ServerConfig, cache: Cache): Router {
  const router = Router({ mergeParams: true });

  // GET /api/:project/bases/:base/variants
  router.get("/:base/variants", (req: Request<{ project: string; base: string }>, res) => {
    const { project, base } = req.params;
    const cacheKey = `variants:${project}:${base}`;
    let variants = cache.get<VariantDetail[]>(cacheKey);
    if (!variants) {
      variants = loadVariants(config, project, base);
      cache.set(cacheKey, variants);
    }
    res.json(variants);
  });

  // GET /api/:project/bases/:base/variants/:variant
  router.get("/:base/variants/:variant", (req: Request<{ project: string; base: string; variant: string }>, res) => {
    const { project, base, variant } = req.params;
    const cacheKey = `variant:${project}:${base}:${variant}`;
    let detail = cache.get<VariantDetail>(cacheKey);
    if (!detail) {
      detail = loadSingleVariant(config, project, base, variant) ?? undefined;
      if (!detail) {
        res.status(404).json({ error: `Variant '${variant}' not found` });
        return;
      }
      cache.set(cacheKey, detail);
    }
    res.json(detail);
  });

  return router;
}

export function createPremadesRouter(config: ServerConfig, cache: Cache): Router {
  const router = Router({ mergeParams: true });

  // GET /api/:project/premades
  router.get("/", (req: Request<{ project: string }>, res) => {
    const { project } = req.params;
    const cacheKey = `premades:${project}`;
    let premades = cache.get<PremadeItem[]>(cacheKey);
    if (!premades) {
      premades = loadPremades(config, project);
      cache.set(cacheKey, premades);
    }
    res.json(premades);
  });

  return router;
}
