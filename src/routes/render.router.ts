import { Router, Request, Response } from "express";
import { ServerConfig } from "../types";
import { compositeAvatar } from "../services/renderer";

interface RenderBody {
  base: string;
  traits: string[];
  variant?: string;
  variantTraits?: string[];
  width?: number;
  height?: number;
}

export function createRenderRouter(config: ServerConfig): Router {
  const router = Router({ mergeParams: true });

  // POST /api/:project/render
  router.post("/render", async (req: Request<{ project: string }>, res: Response) => {
    const { project } = req.params;
    const body = req.body as RenderBody;

    // Validate required fields
    if (!body.base || typeof body.base !== "string") {
      res.status(400).json({ error: "Missing required field: base" });
      return;
    }
    if (!Array.isArray(body.traits) || body.traits.length === 0) {
      res.status(400).json({ error: "Missing required field: traits (non-empty array)" });
      return;
    }

    // Validate optional fields
    if (body.variant !== undefined && typeof body.variant !== "string") {
      res.status(400).json({ error: "Field 'variant' must be a string" });
      return;
    }
    if (body.variantTraits !== undefined && !Array.isArray(body.variantTraits)) {
      res.status(400).json({ error: "Field 'variantTraits' must be an array" });
      return;
    }

    const width = body.width ?? 1600;
    const height = body.height ?? 1600;

    if (typeof width !== "number" || width < 1 || width > 4096) {
      res.status(400).json({ error: "Field 'width' must be a number between 1 and 4096" });
      return;
    }
    if (typeof height !== "number" || height < 1 || height > 4096) {
      res.status(400).json({ error: "Field 'height' must be a number between 1 and 4096" });
      return;
    }

    try {
      const pngBuffer = await compositeAvatar(
        config,
        project,
        body.base,
        body.traits,
        body.variant,
        body.variantTraits,
        width,
        height
      );

      res.set("Content-Type", "image/png");
      res.set("Content-Length", String(pngBuffer.length));
      res.send(pngBuffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Render failed";
      res.status(422).json({ error: message });
    }
  });

  return router;
}
