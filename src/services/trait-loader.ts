import fs from "fs";
import {
  ServerConfig, RawTraitData, TraitItem, CategoryResponse, CategoryMeta,
  PremadeItem, VariantDetail, VariantSubCategory, Frame,
} from "../types";
import { buildImageUrl, buildPremadeImageUrl, buildFrameUrl, buildVariantImageUrl, buildBackgroundImageUrl, buildBackgroundFrameUrl } from "./image-url";
import {
  getTraitDataPath, getPremadesDataPath, getVariantSubdirDataPath,
  getAnimatedTraitDir, discoverAnimatedFrames,
  getBackgroundDataPath, getBackgroundAnimatedDir,
  loadCategoryMeta, loadVariantSubCategoryMeta,
} from "./asset-scanner";

function readDataJson(filePath: string): RawTraitData[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8").trim();
  if (!content || content === "[]") return [];
  return JSON.parse(content);
}

function buildMeta(raw: RawTraitData): Record<string, unknown> | undefined {
  const meta: Record<string, unknown> = {};
  if (raw.chance !== undefined) meta.chance = raw.chance;
  if (raw.training_tags) {
    meta.trainingTags = raw.training_tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return Object.keys(meta).length > 0 ? meta : undefined;
}

function rawToTraitItem(
  raw: RawTraitData,
  config: ServerConfig,
  project: string,
  base: string,
  category: string
): TraitItem {
  const item: TraitItem = {
    id: raw.id,
    name: raw.name,
    isAnimated: raw.isAnimated,
    imageUrl: null,
    blockedBy: raw.blockedBy,
    require: raw.require,
    multiTrait: raw.multiTrait,
    meta: buildMeta(raw),
  };

  if (raw.isAnimated) {
    const animDir = getAnimatedTraitDir(config, project, base, category, raw.path);
    const frameFiles = discoverAnimatedFrames(animDir);
    item.frames = frameFiles.map((f): Frame => ({
      index: parseInt(f),
      imageUrl: buildFrameUrl(config, project, base, category, raw.path, f),
    }));
  } else if (raw.isImage) {
    item.imageUrl = buildImageUrl(config, project, base, category, raw.path);
  }

  return item;
}

function rawToBackgroundItem(
  raw: RawTraitData,
  config: ServerConfig,
  project: string
): TraitItem {
  const item: TraitItem = {
    id: raw.id,
    name: raw.name,
    isAnimated: raw.isAnimated,
    imageUrl: null,
    blockedBy: raw.blockedBy,
    require: raw.require,
    multiTrait: raw.multiTrait,
    meta: buildMeta(raw),
  };

  if (raw.isAnimated) {
    const animDir = getBackgroundAnimatedDir(config, project, raw.path);
    const frameFiles = discoverAnimatedFrames(animDir);
    item.frames = frameFiles.map((f): Frame => ({
      index: parseInt(f),
      imageUrl: buildBackgroundFrameUrl(config, project, raw.path, f),
    }));
  } else if (raw.isImage) {
    item.imageUrl = buildBackgroundImageUrl(config, project, raw.path);
  }

  return item;
}

function loadBackgroundItems(
  config: ServerConfig,
  project: string
): TraitItem[] {
  const dataPath = getBackgroundDataPath(config, project);
  const rawItems = readDataJson(dataPath);
  return rawItems.map((raw) => rawToBackgroundItem(raw, config, project));
}

function rawToVariantSubItem(
  raw: RawTraitData,
  config: ServerConfig,
  project: string,
  base: string,
  variantName: string,
  subdir: string
): TraitItem {
  const item: TraitItem = {
    id: raw.id,
    name: raw.name,
    isAnimated: raw.isAnimated,
    imageUrl: null,
    blockedBy: raw.blockedBy,
    require: raw.require,
    multiTrait: raw.multiTrait,
    meta: buildMeta(raw),
  };

  if (raw.isImage) {
    item.imageUrl = buildVariantImageUrl(config, project, base, variantName, subdir, raw.path);
  }

  return item;
}

export function loadCategoryItems(
  config: ServerConfig,
  project: string,
  base: string,
  categoryId: string
): TraitItem[] {
  if (categoryId === "background") {
    return loadBackgroundItems(config, project);
  }
  const dataPath = getTraitDataPath(config, project, base, categoryId);
  const rawItems = readDataJson(dataPath);
  return rawItems.map((raw) => rawToTraitItem(raw, config, project, base, categoryId));
}

export function loadCategoryResponse(
  config: ServerConfig,
  project: string,
  base: string,
  categoryId: string
): CategoryResponse | null {
  const allMeta = loadCategoryMeta(config, project, base);
  const catMeta = allMeta.find((c) => c.id === categoryId);
  if (!catMeta) return null;

  const items = loadCategoryItems(config, project, base, categoryId);
  return { category: catMeta, base, project, items };
}

export function loadSingleTrait(
  config: ServerConfig,
  project: string,
  base: string,
  categoryId: string,
  traitId: string
): TraitItem | null {
  const items = loadCategoryItems(config, project, base, categoryId);
  return items.find((item) => item.id === traitId) || null;
}

export function loadPremades(config: ServerConfig, project: string): PremadeItem[] {
  const dataPath = getPremadesDataPath(config, project);
  const rawItems = readDataJson(dataPath);

  return rawItems.map((raw) => {
    const meta: Record<string, unknown> = {};
    if (raw.training_tags) {
      meta.trainingTags = raw.training_tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
    return {
      id: raw.id,
      name: raw.name,
      imageUrl: buildPremadeImageUrl(config, project, raw.path),
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    };
  });
}

export function loadVariants(
  config: ServerConfig,
  project: string,
  base: string
): VariantDetail[] {
  const variantDataPath = getTraitDataPath(config, project, base, "variant");
  const rawVariants = readDataJson(variantDataPath);

  return rawVariants.map((raw) => {
    const subCatMeta = loadVariantSubCategoryMeta(config, project, base, raw.path);

    const subCategories: VariantSubCategory[] = subCatMeta.map((meta) => {
      const subPath = getVariantSubdirDataPath(config, project, base, raw.path, meta.id);
      const subItems = readDataJson(subPath);
      const subCat: VariantSubCategory = {
        id: meta.id,
        name: meta.name,
        order: meta.order,
        zIndex: meta.zIndex,
        items: subItems.map((s) =>
          rawToVariantSubItem(s, config, project, base, raw.path, meta.id)
        ),
      };
      if (meta.iconUrl) subCat.iconUrl = meta.iconUrl;
      if (meta.animation) subCat.animation = meta.animation;
      return subCat;
    });

    return { id: raw.id, name: raw.name, subCategories };
  });
}

export function loadSingleVariant(
  config: ServerConfig,
  project: string,
  base: string,
  variantName: string
): VariantDetail | null {
  const variants = loadVariants(config, project, base);
  return variants.find((v) => v.name.toLowerCase() === variantName.toLowerCase()) || null;
}
