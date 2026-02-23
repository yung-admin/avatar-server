import fs from "fs";
import path from "path";
import https from "https";

const ASSETS_DIR = path.resolve(__dirname, "..", "assets");
const MANIFEST_PATH = path.resolve(__dirname, "..", ".gumlet-manifest.json");

const GUMLET_API_KEY = process.env.GUMLET_API_KEY;
const GUMLET_COLLECTION_ID = process.env.GUMLET_COLLECTION_ID;

interface ManifestEntry {
  size: number;
  mtimeMs: number;
  uploadedAt: string;
}

type Manifest = Record<string, ManifestEntry>;

function loadManifest(): Manifest {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  }
  return {};
}

function saveManifest(manifest: Manifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function walkPngs(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkPngs(fullPath));
    } else if (entry.name.toLowerCase().endsWith(".png")) {
      results.push(fullPath);
    }
  }
  return results;
}

function needsUpload(filePath: string, manifest: Manifest): boolean {
  const stat = fs.statSync(filePath);
  const existing = manifest[filePath];
  if (!existing) return true;
  return existing.size !== stat.size || existing.mtimeMs !== stat.mtimeMs;
}

async function uploadFile(filePath: string, relativePath: string): Promise<void> {
  const fileBuffer = fs.readFileSync(filePath);
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);

  let body = "";
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="${path.basename(filePath)}"\r\n`;
  body += `Content-Type: image/png\r\n\r\n`;

  const bodyStart = Buffer.from(body, "utf-8");
  const bodyEnd = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="path"\r\n\r\n${relativePath}\r\n--${boundary}\r\nContent-Disposition: form-data; name="collection_id"\r\n\r\n${GUMLET_COLLECTION_ID}\r\n--${boundary}--\r\n`, "utf-8");

  const payload = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.gumlet.com",
        path: "/v1/image/upload",
        method: "POST",
        headers: {
          Authorization: `Bearer ${GUMLET_API_KEY}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": payload.length,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed (${res.statusCode}): ${data}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  if (!GUMLET_API_KEY || !GUMLET_COLLECTION_ID) {
    console.error("Missing GUMLET_API_KEY or GUMLET_COLLECTION_ID env vars");
    process.exit(1);
  }

  console.log("Scanning assets directory...");
  const allPngs = walkPngs(ASSETS_DIR);
  console.log(`Found ${allPngs.length} PNG files`);

  const manifest = loadManifest();
  const toUpload = allPngs.filter((f) => needsUpload(f, manifest));
  console.log(`${toUpload.length} files need uploading`);

  let uploaded = 0;
  let failed = 0;

  for (const filePath of toUpload) {
    const relativePath = path.relative(ASSETS_DIR, filePath);
    try {
      await uploadFile(filePath, relativePath);
      const stat = fs.statSync(filePath);
      manifest[filePath] = {
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        uploadedAt: new Date().toISOString(),
      };
      uploaded++;
      if (uploaded % 10 === 0) {
        console.log(`Uploaded ${uploaded}/${toUpload.length}...`);
        saveManifest(manifest);
      }
    } catch (err) {
      console.error(`Failed to upload ${relativePath}:`, err);
      failed++;
    }
  }

  saveManifest(manifest);
  console.log(`Done. Uploaded: ${uploaded}, Failed: ${failed}, Skipped: ${allPngs.length - toUpload.length}`);
}

main();
