import fs from "fs";
import path from "path";
import { ServerConfig, CategoryMeta, AnimationType, BaseDefaults } from "../types";
import { buildCategoryIconUrl } from "./image-url";

const PREMADES_DIR = "Legends";

export function discoverProjects(config: ServerConfig): string[] {
  const avatarsDir = path.join(config.assetsBasePath, "avatars");
  if (!fs.existsSync(avatarsDir)) return [];
  return fs
    .readdirSync(avatarsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function discoverBases(config: ServerConfig, project: string): string[] {
  const basesDir = path.join(config.assetsBasePath, "avatars", project, "traits", "shape");
  if (!fs.existsSync(basesDir)) return [];
  return fs
    .readdirSync(basesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== PREMADES_DIR)
    .map((d) => d.name);
}

export function discoverCategoryIds(
  config: ServerConfig,
  project: string,
  base: string
): string[] {
  const baseDir = path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape", base
  );
  if (!fs.existsSync(baseDir)) return [];
  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function loadCategoryMeta(
  config: ServerConfig,
  project: string,
  base: string
): CategoryMeta[] {
  const metaPath = path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape", base, "categories.json"
  );

  const categoryIds = discoverCategoryIds(config, project, base);

  let categories: CategoryMeta[];

  // If a categories.json override file exists, use it
  if (fs.existsSync(metaPath)) {
    const overrides: Record<string, Partial<CategoryMeta>> = JSON.parse(
      fs.readFileSync(metaPath, "utf-8")
    );
    categories = categoryIds.map((id, i) => {
      const ov = overrides[id] || {};
      const cat: CategoryMeta = {
        id,
        name: ov.name ?? titleCase(id),
        order: ov.order ?? i,
        zIndex: ov.zIndex ?? i,
        required: ov.required ?? false,
        iconUrl: buildCategoryIconUrl(config, id),
      };
      if (ov.animation) cat.animation = ov.animation as AnimationType;
      return cat;
    });
  } else {
    // Default: auto-generate from directory names
    categories = categoryIds.map((id, i) => ({
      id,
      name: titleCase(id),
      order: i,
      zIndex: i,
      required: false,
      iconUrl: buildCategoryIconUrl(config, id),
    }));
  }

  // Inject project-level background if it exists and isn't already in the list
  if (hasProjectBackground(config, project) && !categories.some((c) => c.id === "background")) {
    categories.push({
      id: "background",
      name: "Background",
      order: -1,
      zIndex: -1,
      required: false,
      iconUrl: buildCategoryIconUrl(config, "background"),
      animation: "fade",
    });
  }

  return categories.sort((a, b) => a.order - b.order);
}

export function getBackgroundDataPath(config: ServerConfig, project: string): string {
  return path.join(
    config.assetsBasePath, "avatars", project, "traits", "background", "data.json"
  );
}

export function getBackgroundAnimatedDir(
  config: ServerConfig,
  project: string,
  traitPath: string
): string {
  return path.join(
    config.assetsBasePath, "avatars", project, "traits", "background", traitPath
  );
}

export function hasProjectBackground(config: ServerConfig, project: string): boolean {
  const bgDir = path.join(
    config.assetsBasePath, "avatars", project, "traits", "background"
  );
  return fs.existsSync(bgDir);
}

export function getDefaultImageFilename(config: ServerConfig, project: string): string | null {
  const defaultPath = path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape", "default.png"
  );
  return fs.existsSync(defaultPath) ? "default.png" : null;
}

export function hasPremades(config: ServerConfig, project: string): boolean {
  const premadesDir = path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape", PREMADES_DIR
  );
  return fs.existsSync(premadesDir);
}

export function discoverVariantSubdirs(
  config: ServerConfig,
  project: string,
  base: string,
  variantName: string
): string[] {
  const variantDir = path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape", base,
    "variant", variantName
  );
  if (!fs.existsSync(variantDir)) return [];
  // Discover ALL subdirectories — no hardcoded filter
  return fs
    .readdirSync(variantDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function discoverAnimatedFrames(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d+\.png$/i.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
}

export function getTraitDataPath(
  config: ServerConfig,
  project: string,
  base: string,
  category: string
): string {
  return path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape",
    base, category, "data.json"
  );
}

export function getVariantSubdirDataPath(
  config: ServerConfig,
  project: string,
  base: string,
  variantName: string,
  subdir: string
): string {
  return path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape",
    base, "variant", variantName, subdir, "data.json"
  );
}

export function getPremadesDataPath(config: ServerConfig, project: string): string {
  return path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape",
    PREMADES_DIR, "data.json"
  );
}

export function getAnimatedTraitDir(
  config: ServerConfig,
  project: string,
  base: string,
  category: string,
  traitPath: string
): string {
  return path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape",
    base, category, traitPath
  );
}

export interface VariantSubCategoryMeta {
  id: string;
  name: string;
  order: number;
  zIndex: number;
  iconUrl?: string;
  animation?: AnimationType;
}

export function loadVariantSubCategoryMeta(
  config: ServerConfig,
  project: string,
  base: string,
  variantName: string
): VariantSubCategoryMeta[] {
  const variantDir = path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape", base,
    "variant", variantName
  );
  const metaPath = path.join(variantDir, "categories.json");
  const subdirNames = discoverVariantSubdirs(config, project, base, variantName);

  if (fs.existsSync(metaPath)) {
    const overrides: Record<string, Partial<VariantSubCategoryMeta>> = JSON.parse(
      fs.readFileSync(metaPath, "utf-8")
    );
    return subdirNames.map((id, i) => {
      const ov = overrides[id] || {};
      const meta: VariantSubCategoryMeta = {
        id,
        name: ov.name ?? titleCase(id),
        order: ov.order ?? i,
        zIndex: ov.zIndex ?? i,
        iconUrl: buildCategoryIconUrl(config, id),
      };
      if (ov.animation) meta.animation = ov.animation as AnimationType;
      return meta;
    }).sort((a, b) => a.order - b.order);
  }

  return subdirNames.map((id, i) => ({
    id,
    name: titleCase(id),
    order: i,
    zIndex: i,
    iconUrl: buildCategoryIconUrl(config, id),
  }));
}

export function loadBaseDefaults(
  config: ServerConfig,
  project: string,
  base: string
): BaseDefaults {
  const defaultsPath = path.join(
    config.assetsBasePath, "avatars", project, "traits", "shape", base, "defaults.json"
  );

  if (fs.existsSync(defaultsPath)) {
    const raw = JSON.parse(fs.readFileSync(defaultsPath, "utf-8"));
    return {
      variant: raw.variant ?? null,
      variantTraits: raw.variantTraits ?? {},
      traits: raw.traits ?? {},
    };
  }

  return { variant: null, variantTraits: {}, traits: {} };
}

export function getProjectDefaultBase(config: ServerConfig, project: string): string | null {
  const manifestPath = path.join(
    config.assetsBasePath, "avatars", project, "manifest.json"
  );

  if (fs.existsSync(manifestPath)) {
    const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    return raw.defaultBase ?? null;
  }

  return null;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
