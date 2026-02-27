import { Router, Request } from "express";
import { ServerConfig, ProjectManifest } from "../types";
import { Cache } from "../services/cache";
import { discoverProjects, discoverBases, hasPremades, getDefaultImageFilename, getProjectDefaultBase } from "../services/asset-scanner";
import { buildDefaultImageUrl } from "../services/image-url";

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
      const defaultFilename = getDefaultImageFilename(config, project);
      manifest = {
        name: project,
        bases,
        defaultBase: getProjectDefaultBase(config, project),
        hasPremades: hasPremades(config, project),
        defaultImageUrl: defaultFilename
          ? buildDefaultImageUrl(config, project, defaultFilename)
          : null,
      };
      cache.set(cacheKey, manifest);
    }
    res.json(manifest);
  });

  return router;
}
