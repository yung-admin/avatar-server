import { Router, Request } from "express";
import { ServerConfig, CategoryResponse, TraitItem, TraitTree, TraitTreeCategory } from "../types";
import { Cache } from "../services/cache";
import { loadCategoryMeta } from "../services/asset-scanner";
import { loadCategoryResponse, loadCategoryItems, loadSingleTrait } from "../services/trait-loader";

export function createCategoryRouter(config: ServerConfig, cache: Cache): Router {
  const router = Router({ mergeParams: true });

  // GET /api/:project/bases/:base/tree
  router.get("/:base/tree", (req: Request<{ project: string; base: string }>, res) => {
    const { project, base } = req.params;
    const cacheKey = `tree:${project}:${base}`;
    let tree = cache.get<TraitTree>(cacheKey);
    if (!tree) {
      const catMetas = loadCategoryMeta(config, project, base);
      const categories: TraitTreeCategory[] = catMetas.map((meta) => ({
        category: meta,
        items: loadCategoryItems(config, project, base, meta.id),
      }));
      tree = { base, project, categories };
      cache.set(cacheKey, tree);
    }
    res.json(tree);
  });

  // GET /api/:project/bases/:base/categories/:category
  router.get("/:base/categories/:category", (req: Request<{ project: string; base: string; category: string }>, res) => {
    const { project, base, category } = req.params;
    const cacheKey = `cat:${project}:${base}:${category}`;
    let data = cache.get<CategoryResponse>(cacheKey);
    if (!data) {
      data = loadCategoryResponse(config, project, base, category) ?? undefined;
      if (!data) {
        res.status(404).json({ error: `Category '${category}' not found for base '${base}'` });
        return;
      }
      cache.set(cacheKey, data);
    }
    res.json(data);
  });

  // GET /api/:project/bases/:base/categories/:category/:traitId
  router.get("/:base/categories/:category/:traitId", (req: Request<{ project: string; base: string; category: string; traitId: string }>, res) => {
    const { project, base, category, traitId } = req.params;
    const cacheKey = `trait:${project}:${base}:${category}:${traitId}`;
    let item = cache.get<TraitItem>(cacheKey);
    if (!item) {
      item = loadSingleTrait(config, project, base, category, traitId) ?? undefined;
      if (!item) {
        res.status(404).json({ error: `Trait '${traitId}' not found in '${category}'` });
        return;
      }
      cache.set(cacheKey, item);
    }
    res.json(item);
  });

  return router;
}
