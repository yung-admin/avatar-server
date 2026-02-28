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

export type AnimationType = "fade" | "leftToRight";
export type AnimationBehavior = "blend" | "stack";

export interface CategoryMeta {
  id: string;
  name: string;
  order: number;
  zIndex: number;
  required: boolean;
  iconUrl?: string;
  defaultTraitId?: string | null;
  animation?: AnimationType;
  animationBehavior?: AnimationBehavior;
}

export interface CategoryResponse {
  category: CategoryMeta;
  base: string;
  project: string;
  items: TraitItem[];
}

export interface BaseDefaults {
  traits: Record<string, string | null>;
  variant: string | null;
  variantTraits: Record<string, string | null>;
}

export interface BaseInfo {
  id: string;
  name: string;
  categories: CategoryMeta[];
  defaults: BaseDefaults;
}

export interface ProjectManifest {
  name: string;
  bases: string[];
  defaultBase: string | null;
  hasPremades: boolean;
  defaultImageUrl: string | null;
}

export interface VariantSubCategory {
  id: string;
  name: string;
  order: number;
  zIndex: number;
  required: boolean;
  iconUrl?: string;
  defaultTraitId?: string | null;
  animation?: AnimationType;
  animationBehavior?: AnimationBehavior;
  items: TraitItem[];
}

export interface VariantDetail {
  id: string;
  name: string;
  subCategories: VariantSubCategory[];
  defaults: Record<string, string | null>;
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
