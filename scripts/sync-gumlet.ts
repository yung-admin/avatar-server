/**
 * Gumlet CDN Management Script
 *
 * Gumlet is a CDN proxy — it does NOT store your images. You create an
 * "image source" pointing to your origin server (or S3), and Gumlet
 * fetches, optimizes, caches, and serves images on demand.
 *
 * This script helps you:
 *   1. Create a web-folder image source pointing to your origin
 *   2. List your existing sources
 *   3. Purge cached images when you've updated assets
 *
 * Usage:
 *   npm run sync:gumlet -- create-source
 *   npm run sync:gumlet -- list-sources
 *   npm run sync:gumlet -- purge <url-path>
 *   npm run sync:gumlet -- purge-all
 *
 * Requires GUMLET_API_KEY, GUMLET_SUBDOMAIN, and GUMLET_ORIGIN_URL in .env
 */

import "dotenv/config";
import https from "https";

const API_KEY = process.env.GUMLET_API_KEY;
const SUBDOMAIN = process.env.GUMLET_SUBDOMAIN;
const ORIGIN_URL = process.env.GUMLET_ORIGIN_URL;

function apiRequest(method: string, path: string, body?: object): Promise<{ status: number; data: unknown }> {
  const payload = body ? JSON.stringify(body) : undefined;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.gumlet.com",
        path: `/v1${path}`,
        method,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode || 0, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 0, data });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function createSource() {
  if (!ORIGIN_URL) {
    console.error("GUMLET_ORIGIN_URL is required to create a source");
    process.exit(1);
  }
  if (!SUBDOMAIN) {
    console.error("GUMLET_SUBDOMAIN is required to create a source");
    process.exit(1);
  }

  console.log(`Creating web-folder source...`);
  console.log(`  Subdomain: ${SUBDOMAIN}.gumlet.io`);
  console.log(`  Origin:    ${ORIGIN_URL}`);

  const { status, data } = await apiRequest("POST", "/image/sources", {
    name: SUBDOMAIN,
    source_type: "web_folder",
    base_url: ORIGIN_URL,
    subdomain: SUBDOMAIN,
  });

  if (status >= 200 && status < 300) {
    console.log("Source created successfully:", JSON.stringify(data, null, 2));
  } else {
    console.error(`Failed (${status}):`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
}

async function listSources() {
  console.log("Fetching image sources...");
  const { status, data } = await apiRequest("GET", "/image/sources");

  if (status >= 200 && status < 300) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error(`Failed (${status}):`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
}

async function purgeCache(urlPath: string) {
  if (!SUBDOMAIN) {
    console.error("GUMLET_SUBDOMAIN is required for cache purging");
    process.exit(1);
  }

  console.log(`Purging cache for: ${urlPath}`);
  const { status, data } = await apiRequest("POST", `/purge/${SUBDOMAIN}`, {
    url_path: urlPath,
  });

  if (status >= 200 && status < 300) {
    console.log("Cache purged:", JSON.stringify(data, null, 2));
  } else {
    console.error(`Failed (${status}):`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
}

async function purgeAll() {
  if (!SUBDOMAIN) {
    console.error("GUMLET_SUBDOMAIN is required for cache purging");
    process.exit(1);
  }

  console.log(`Purging entire cache for ${SUBDOMAIN}.gumlet.io ...`);
  console.log("Note: full workspace purge requires Business or Enterprise plan.");
  const { status, data } = await apiRequest("POST", `/purge/${SUBDOMAIN}`, {
    purge_all: true,
  });

  if (status >= 200 && status < 300) {
    console.log("Cache purged:", JSON.stringify(data, null, 2));
  } else {
    console.error(`Failed (${status}):`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
}

async function main() {
  if (!API_KEY) {
    console.error("Missing GUMLET_API_KEY in .env");
    process.exit(1);
  }

  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "create-source":
      await createSource();
      break;
    case "list-sources":
      await listSources();
      break;
    case "purge":
      if (!args[0]) {
        console.error("Usage: npm run sync:gumlet -- purge <url-path>");
        console.error("Example: npm run sync:gumlet -- purge /avatars/yogicats/traits/shape/yogicat/headgear/babybeanie.png");
        process.exit(1);
      }
      await purgeCache(args[0]);
      break;
    case "purge-all":
      await purgeAll();
      break;
    default:
      console.log("Gumlet CDN Management");
      console.log("");
      console.log("Gumlet is a CDN proxy — it fetches images from your origin server,");
      console.log("optimizes them, and serves via CDN. No file uploading needed.");
      console.log("");
      console.log("Commands:");
      console.log("  create-source  Create a web-folder image source pointing to your origin");
      console.log("  list-sources   List all configured image sources");
      console.log("  purge <path>   Purge CDN cache for a specific image URL path");
      console.log("  purge-all      Purge entire CDN cache (Business/Enterprise plan only)");
      console.log("");
      console.log("Setup:");
      console.log("  1. Set GUMLET_API_KEY, GUMLET_SUBDOMAIN, GUMLET_ORIGIN_URL in .env");
      console.log("  2. Run: npm run sync:gumlet -- create-source");
      console.log("  3. Set IMAGE_MODE=cdn in .env to switch API responses to CDN URLs");
      console.log("  4. Images at {ORIGIN}/path/image.png are now served via {SUBDOMAIN}.gumlet.io/path/image.png");
      break;
  }
}

main();
