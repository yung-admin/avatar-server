import { Router, Request } from "express";
import { ServerConfig, ProjectManifest } from "../types";
import { Cache } from "../services/cache";
import { discoverProjects, discoverBases, hasPremades } from "../services/asset-scanner";

export function createManifestRouter(config: ServerConfig, cache: Cache): Router {
  const router = Router({ mergeParams: true });

  // GET /api/projects — list all hosted projects (multi-tenant only)
  router.get("/projects", (req, res) => {
    const cacheKey = "projects";
    let projects = cache.get<string[]>(cacheKey);
    if (!projects) {
      projects = discoverProjects(config);
      cache.set(cacheKey, projects);
    }
    res.json(projects);
  });

  // GET /api/:project — project manifest
  router.get("/:project", (req: Request<{ project: string }>, res) => {
    const { project } = req.params;
    const cacheKey = `manifest:${project}`;
    let manifest = cache.get<ProjectManifest>(cacheKey);
    if (!manifest) {
      const bases = discoverBases(config, project);
      if (bases.length === 0) {
        res.status(404).json({ error: `Project '${project}' not found` });
        return;
      }
      manifest = {
        name: project,
        bases,
        hasPremades: hasPremades(config, project),
      };
      cache.set(cacheKey, manifest);
    }
    res.json(manifest);
  });

  return router;
}
