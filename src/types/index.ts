export interface ServerConfig {
  port: number;
  assetsBasePath: string;
  imageServing: {
    mode: "local" | "cdn";
    localBaseUrl: string;
    cdnBaseUrl: string;
  };
  auth: {
    enabled: boolean;
    apiKeys: string[];
    publicEndpoints: string[];
  };
  cache: {
    ttlSeconds: number;
  };
}

// Raw data as it exists in data.json files on disk
export interface RawTraitData {
  name: string;
  path: string;
  chance: number;
  blockedBy: string[];
  id: string;
  require: string[];
  multiTrait: string[];
  isAnimated: boolean;
  isImage: boolean;
  training_tags?: string;
}

// --- Generic avatar editor spec types ---

export interface Frame {
  index: number;
  imageUrl: string;
}

export interface TraitItem {
  id: string;
  name: string;
  isAnimated: boolean;
  imageUrl: string | null;
  frames?: Frame[];
  blockedBy: string[];
  require: string[];
  multiTrait: string[];
  meta?: Record<string, unknown>;
}

export interface CategoryMeta {
  id: string;
  name: string;
  order: number;
  zIndex: number;
  required: boolean;
}

export interface CategoryResponse {
  category: CategoryMeta;
  base: string;
  project: string;
  items: TraitItem[];
}

export interface BaseInfo {
  id: string;
  name: string;
  categories: CategoryMeta[];
}

export interface ProjectManifest {
  name: string;
  bases: string[];
  hasPremades: boolean;
}

export interface VariantSubCategory {
  id: string;
  name: string;
  items: TraitItem[];
}

export interface VariantDetail {
  id: string;
  name: string;
  subCategories: VariantSubCategory[];
}

export interface PremadeItem {
  id: string;
  name: string;
  imageUrl: string;
  meta?: Record<string, unknown>;
}

export interface TraitTreeCategory {
  category: CategoryMeta;
  items: TraitItem[];
}

export interface TraitTree {
  base: string;
  project: string;
  categories: TraitTreeCategory[];
}
