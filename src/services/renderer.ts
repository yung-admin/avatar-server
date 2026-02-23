import fs from "fs";
import path from "path";
import sharp from "sharp";
import { ServerConfig, RawTraitData, CategoryMeta } from "../types";
import {
  discoverCategoryIds,
  getTraitDataPath,
  loadCategoryMeta,
  discoverVariantSubdirs,
  getVariantSubdirDataPath,
} from "./asset-scanner";

interface ResolvedLayer {
  filePath: string;
  zIndex: number;
}

/**
 * Scan all categories' data.json to find a trait by ID and return its local file path.
 */
export function resolveTraitImagePath(
  config: ServerConfig,
  project: string,
  base: string,
  traitId: string
): { filePath: string; category: string } | null {
  const categoryIds = discoverCategoryIds(config, project, base);

  for (const cat of categoryIds) {
    if (cat === "variant") continue; // variants handled separately
    const dataPath = getTraitDataPath(config, project, base, cat);
    if (!fs.existsSync(dataPath)) continue;

    const raw: RawTraitData[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const trait = raw.find((t) => t.id === traitId);
    if (trait && trait.isImage && !trait.isAnimated) {
      const filePath = path.join(
        config.assetsBasePath, "avatars", project, "traits", "shape",
        base, cat, trait.path
      );
      return { filePath, category: cat };
    }
  }

  return null;
}

/**
 * Resolve a variant sub-trait ID to its local file path.
 */
export function resolveVariantImagePath(
  config: ServerConfig,
  project: string,
  base: string,
  variant: string,
  traitId: string
): string | null {
  const subdirs = discoverVariantSubdirs(config, project, base, variant);

  for (const subdir of subdirs) {
    const dataPath = getVariantSubdirDataPath(config, project, base, variant, subdir);
    if (!fs.existsSync(dataPath)) continue;

    const raw: RawTraitData[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const trait = raw.find((t) => t.id === traitId);
    if (trait && trait.isImage) {
      return path.join(
        config.assetsBasePath, "avatars", project, "traits", "shape",
        base, "variant", variant, subdir, trait.path
      );
    }
  }

  return null;
}

/**
 * Composite selected traits into a single PNG buffer.
 */
export async function compositeAvatar(
  config: ServerConfig,
  project: string,
  base: string,
  traitIds: string[],
  variant?: string,
  variantTraitIds?: string[],
  width: number = 1600,
  height: number = 1600
): Promise<Buffer> {
  const categoryMeta = loadCategoryMeta(config, project, base);
  const metaByCategory = new Map<string, CategoryMeta>();
  for (const m of categoryMeta) {
    metaByCategory.set(m.id, m);
  }

  const layers: ResolvedLayer[] = [];

  // Resolve variant sub-traits (these go at zIndex 0 — the variant layer)
  if (variant && variantTraitIds && variantTraitIds.length > 0) {
    const variantMeta = metaByCategory.get("variant");
    const variantZIndex = variantMeta?.zIndex ?? 0;

    for (const vtId of variantTraitIds) {
      const filePath = resolveVariantImagePath(config, project, base, variant, vtId);
      if (!filePath) {
        throw new Error(`Variant trait not found: ${vtId}`);
      }
      if (!fs.existsSync(filePath)) {
        throw new Error(`Variant trait image file missing: ${vtId}`);
      }
      layers.push({ filePath, zIndex: variantZIndex });
    }
  }

  // Resolve regular traits
  for (const traitId of traitIds) {
    const resolved = resolveTraitImagePath(config, project, base, traitId);
    if (!resolved) {
      throw new Error(`Trait not found: ${traitId}`);
    }
    if (!fs.existsSync(resolved.filePath)) {
      throw new Error(`Trait image file missing: ${traitId}`);
    }
    const catMeta = metaByCategory.get(resolved.category);
    layers.push({
      filePath: resolved.filePath,
      zIndex: catMeta?.zIndex ?? 0,
    });
  }

  // Sort by zIndex ascending (bottom to top)
  layers.sort((a, b) => a.zIndex - b.zIndex);

  // Use the first layer as the base, composite the rest on top
  if (layers.length === 0) {
    // No layers — return transparent canvas
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).png().toBuffer();
  }

  let pipeline = sharp(layers[0].filePath);

  if (layers.length > 1) {
    pipeline = pipeline.composite(
      layers.slice(1).map((layer) => ({ input: layer.filePath }))
    );
  }

  // Composite first at native resolution, then resize in a second pass
  // (sharp applies resize before composite internally, so we must separate them)
  let buffer = await pipeline.png().toBuffer();

  if (width !== 1600 || height !== 1600) {
    buffer = await sharp(buffer).resize(width, height).png().toBuffer();
  }

  return buffer;
}
