import { ServerConfig } from "../types";

export function getBaseUrl(config: ServerConfig): string {
  if (config.imageServing.mode === "cdn") {
    return config.imageServing.cdnBaseUrl;
  }
  return config.imageServing.localBaseUrl;
}

export function buildImageUrl(
  config: ServerConfig,
  project: string,
  base: string,
  category: string,
  filename: string
): string {
  return `${getBaseUrl(config)}/avatars/${project}/traits/shape/${base}/${category}/${filename}`;
}

export function buildPremadeImageUrl(
  config: ServerConfig,
  project: string,
  filename: string
): string {
  return `${getBaseUrl(config)}/avatars/${project}/traits/shape/Legends/${filename}`;
}

export function buildFrameUrl(
  config: ServerConfig,
  project: string,
  base: string,
  category: string,
  traitFolder: string,
  frameFilename: string
): string {
  return `${getBaseUrl(config)}/avatars/${project}/traits/shape/${base}/${category}/${traitFolder}/${frameFilename}`;
}

export function buildDefaultImageUrl(
  config: ServerConfig,
  project: string,
  filename: string
): string {
  return `${getBaseUrl(config)}/avatars/${project}/traits/shape/${filename}`;
}

export function buildVariantImageUrl(
  config: ServerConfig,
  project: string,
  base: string,
  variantName: string,
  subdir: string,
  filename: string
): string {
  return `${getBaseUrl(config)}/avatars/${project}/traits/shape/${base}/variant/${variantName}/${subdir}/${filename}`;
}
