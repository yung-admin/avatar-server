import { Router, Request } from "express";
import { ServerConfig } from "../types";
import { Cache } from "../services/cache";
import { buildCategoryIconUrl, buildUtilityIconUrl } from "../services/image-url";

const CATEGORY_ICONS = [
  "background", "variant", "ears", "top", "chain",
  "nose", "mouth", "eyes", "faceart", "glasses",
  "headgear", "suits", "pattern", "arms",
];

const UTILITY_ICONS = ["eye", "save", "close", "template"];

export function createIconRouter(config: ServerConfig, cache: Cache): Router {
  const router = Router({ mergeParams: true });

  router.get("/icons", (_req: Request, res) => {
    const cacheKey = "icons";
    let icons = cache.get<Record<string, Record<string, string>>>(cacheKey);
    if (!icons) {
      const categories: Record<string, string> = {};
      for (const name of CATEGORY_ICONS) {
        categories[name] = buildCategoryIconUrl(config, name);
      }
      const utility: Record<string, string> = {};
      for (const name of UTILITY_ICONS) {
        utility[name] = buildUtilityIconUrl(config, name);
      }
      icons = { categories, utility };
      cache.set(cacheKey, icons);
    }
    res.json(icons);
  });

  return router;
}
