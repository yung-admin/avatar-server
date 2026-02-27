# Avatar Editor API Specification

This document describes the API contract your server must implement for the **PFP Editor** to load, display, and compose your project's avatar traits.

The editor communicates with your API using a single **Base URL** that you provide (e.g. `https://api.yourproject.com/api`). All endpoints below are relative to that base URL.

---

## Quick Start

The editor fetches data in this order:

1. `GET /` — read your project manifest (available bases, premades flag)
2. `GET /bases/:base` — get category list with rendering metadata
3. `GET /bases/:base/tree` — load all traits at once _(or fetch categories individually)_
4. `GET /bases/:base/variants` — load variant options
5. `GET /icons` — discover all available UI icons
6. `GET /premades` — load premade PFPs _(if `hasPremades` is true)_

All responses must be **JSON** with `Content-Type: application/json`.

---

## CORS

Your API must allow cross-origin requests from the editor's domain. At minimum, return these headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Endpoints

### `GET /` — Project Manifest

Returns top-level info about your project.

**Response**

```json
{
  "name": "myproject",
  "bases": ["human", "robot"],
  "defaultBase": "human",
  "hasPremades": true,
  "defaultImageUrl": "https://api.yourproject.com/static/default.png"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Your project's identifier |
| `bases` | `string[]` | Available base body types |
| `defaultBase` | `string \| null` | The recommended base to load initially. `null` if not configured. |
| `hasPremades` | `boolean` | Whether `/premades` has content |
| `defaultImageUrl` | `string \| null` | URL to the default PFP image, shown when no avatar has been built yet. `null` if not configured. |

---

### `GET /bases` — List Bases

Returns the list of available base body type IDs.

**Response**

```json
["human", "robot"]
```

---

### `GET /bases/:base` — Base Detail

Returns a base body type with its ordered list of trait categories and rendering metadata.

**Response**

```json
{
  "id": "human",
  "name": "Human",
  "categories": [
    { "id": "skin",     "name": "Skin Tone", "order": 0, "zIndex": 0, "required": true,  "animation": "fade" },
    { "id": "eyes",     "name": "Eyes",      "order": 1, "zIndex": 1, "required": true,  "animation": "fade" },
    { "id": "hair",     "name": "Hair",      "order": 2, "zIndex": 5, "required": false, "animation": "fade" },
    { "id": "hat",      "name": "Hat",       "order": 3, "zIndex": 6, "required": false, "animation": "leftToRight" },
    { "id": "glasses",  "name": "Glasses",   "order": 4, "zIndex": 7, "required": false, "animation": "leftToRight" },
    { "id": "variant",  "name": "Variant",   "order": 5, "zIndex": -1, "required": true, "animation": "fade" }
  ],
  "defaults": {
    "variant": "snow",
    "variantTraits": {
      "pattern": "yogicat-snow-pattern-none",
      "arms": null
    },
    "traits": {
      "eyes": "eyes-boss",
      "nose": "nose-boss",
      "mouth": "mouth-serious",
      "hair": null,
      "hat": null,
      "glasses": null
    }
  }
}
```

#### Category Metadata

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Category identifier, used in URLs |
| `name` | `string` | Human-readable display name |
| `order` | `number` | Display order in the editor UI (ascending) |
| `zIndex` | `number` | Layer stacking order when compositing the avatar. Higher values render on top. |
| `required` | `boolean` | If `true`, the user must select a trait from this category |
| `iconUrl` | `string?` | URL to the category's SVG icon for the editor UI. Optional. |
| `animation` | `"fade" \| "leftToRight"` | Preferred transition animation when switching traits in this category. Optional. |

#### Base Defaults

The `defaults` object tells the editor which traits to pre-select when the user first opens a base.

| Field | Type | Description |
|-------|------|-------------|
| `variant` | `string \| null` | Default variant name to select (e.g. `"snow"`). `null` for no default. |
| `variantTraits` | `Record<string, string \| null>` | Default variant sub-category trait IDs. Keys are sub-category IDs, values are trait IDs or `null`. |
| `traits` | `Record<string, string \| null>` | Default trait IDs per category. Keys are category IDs, values are trait IDs or `null` for no selection. |

---

### `GET /bases/:base/categories/:category` — Traits in a Category

Returns all trait items for a given category.

**Response**

```json
{
  "category": {
    "id": "hat",
    "name": "Hat",
    "order": 3,
    "zIndex": 6,
    "required": false
  },
  "base": "human",
  "project": "myproject",
  "items": [
    {
      "id": "hat-beanie",
      "name": "Beanie",
      "isAnimated": false,
      "imageUrl": "https://api.yourproject.com/static/hats/beanie.png",
      "blockedBy": [],
      "require": [],
      "multiTrait": [],
      "meta": {
        "rarity": "common"
      }
    }
  ]
}
```

---

### `GET /bases/:base/categories/:category/:traitId` — Single Trait

Returns a single trait item by ID.

**Response** — same shape as one item from the `items` array above:

```json
{
  "id": "hat-beanie",
  "name": "Beanie",
  "isAnimated": false,
  "imageUrl": "https://api.yourproject.com/static/hats/beanie.png",
  "blockedBy": [],
  "require": [],
  "multiTrait": [],
  "meta": {
    "rarity": "common"
  }
}
```

---

### `GET /bases/:base/tree` — Full Trait Tree

Returns every category and all its traits in a single call. Use this to load everything at once instead of fetching each category individually.

**Response**

```json
{
  "base": "human",
  "project": "myproject",
  "categories": [
    {
      "category": {
        "id": "eyes",
        "name": "Eyes",
        "order": 1,
        "zIndex": 1,
        "required": true
      },
      "items": [
        {
          "id": "eyes-blue",
          "name": "Blue",
          "isAnimated": false,
          "imageUrl": "https://api.yourproject.com/static/eyes/blue.png",
          "blockedBy": [],
          "require": [],
          "multiTrait": []
        }
      ]
    }
  ]
}
```

---

### `GET /bases/:base/variants` — All Variants

Variants are alternate body styles for a base (e.g. color schemes, outfits). Each variant has its own **sub-categories** of traits — these are dynamic and can be anything your project needs.

**Response**

```json
[
  {
    "id": "variant-ice",
    "name": "Ice",
    "subCategories": [
      {
        "id": "pattern",
        "name": "Pattern",
        "order": 0,
        "zIndex": 0,
        "animation": "fade",
        "items": [
          {
            "id": "pattern-snowflake",
            "name": "Snowflake",
            "isAnimated": false,
            "imageUrl": "https://api.yourproject.com/static/variants/ice/pattern/snowflake.png",
            "blockedBy": [],
            "require": [],
            "multiTrait": []
          }
        ]
      },
      {
        "id": "arms",
        "name": "Arms",
        "order": 1,
        "zIndex": 1,
        "animation": "fade",
        "items": [
          {
            "id": "arms-crossed",
            "name": "Crossed",
            "isAnimated": false,
            "imageUrl": "https://api.yourproject.com/static/variants/ice/arms/crossed.png",
            "blockedBy": [],
            "require": [],
            "multiTrait": []
          }
        ]
      }
    ]
  }
]
```

The `subCategories` array is **dynamic** — your project defines what sub-categories each variant has. The editor will render whatever you provide.

Sub-category ordering is controlled by an optional `categories.json` file inside each variant directory (e.g. `variant/ice/categories.json`). This works the same way as the base-level `categories.json` — it defines `order` (display sequence) and `zIndex` (stacking order within the variant layer). If no `categories.json` exists, sub-categories default to alphabetical order.

---

### `GET /bases/:base/variants/:variant` — Single Variant

Returns one variant by name (case-insensitive match).

**Response** — same shape as one item from the array above.

---

### `GET /premades` — Premade PFPs

Pre-built, non-composable avatar images (e.g. legendary characters, special editions). Only required if `hasPremades` is `true` in the project manifest.

**Response**

```json
[
  {
    "id": "premade-frostking",
    "name": "Frost King",
    "imageUrl": "https://api.yourproject.com/static/premades/frostking.png",
    "meta": {
      "edition": "genesis"
    }
  }
]
```

---

### `GET /icons` — Available Icons

Returns all available UI icons grouped by type. The editor can use these to display category icons, visibility toggles, save buttons, etc.

**Response**

```json
{
  "categories": {
    "background": "https://api.yourproject.com/static/icons/categories/background.svg",
    "variant": "https://api.yourproject.com/static/icons/categories/variant.svg",
    "ears": "https://api.yourproject.com/static/icons/categories/ears.svg",
    "eyes": "https://api.yourproject.com/static/icons/categories/eyes.svg"
  },
  "utility": {
    "eye": "https://api.yourproject.com/static/icons/utility/eye.svg",
    "save": "https://api.yourproject.com/static/icons/utility/save.svg",
    "close": "https://api.yourproject.com/static/icons/utility/close.svg",
    "template": "https://api.yourproject.com/static/icons/utility/template.svg"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `categories` | `Record<string, string>` | Map of category/sub-category icon name to SVG URL |
| `utility` | `Record<string, string>` | Map of utility icon name to SVG URL |

Icons are also available directly at `/static/icons/categories/{name}.svg` and `/static/icons/utility/{name}.svg`.

---

## Data Types Reference

### TraitItem

The core unit — a single selectable trait.

```typescript
interface TraitItem {
  id: string;            // Unique identifier (e.g. "hat-beanie")
  name: string;          // Display name (e.g. "Beanie")
  isAnimated: boolean;   // true = multi-frame animation (see below)
  imageUrl: string | null; // URL to the trait image. null for animated traits.
  frames?: Frame[];      // Only present when isAnimated is true
  blockedBy: string[];   // Trait IDs that prevent this trait from being selected
  require: string[];     // Trait IDs that must be selected for this to be available
  multiTrait: string[];  // Trait IDs that are bundled with this trait
  meta?: Record<string, unknown>; // Optional project-specific data (see below)
}
```

### Frame

One frame of an animated trait.

```typescript
interface Frame {
  index: number;   // Frame number (1-based)
  imageUrl: string; // URL to this frame's image
}
```

### CategoryMeta

```typescript
type AnimationType = "fade" | "leftToRight";

interface CategoryMeta {
  id: string;                    // Category identifier, used in URLs
  name: string;                  // Display name
  order: number;                 // UI display order (ascending)
  zIndex: number;                // Compositing layer order (higher = on top)
  required: boolean;             // Must the user pick a trait from this category?
  iconUrl?: string;              // URL to the category's SVG icon
  animation?: AnimationType;     // Preferred transition animation
}
```

### VariantDetail

```typescript
interface VariantDetail {
  id: string;
  name: string;
  subCategories: VariantSubCategory[];
}

interface VariantSubCategory {
  id: string;                    // e.g. "pattern", "arms", "marking" — you decide
  name: string;                  // Display name
  order: number;                 // Display order (ascending) — from variant's categories.json
  zIndex: number;                // Sub-category stacking order within the variant layer
  iconUrl?: string;              // URL to the sub-category's SVG icon
  animation?: AnimationType;     // Preferred transition animation
  items: TraitItem[];
}
```

### PremadeItem

```typescript
interface PremadeItem {
  id: string;
  name: string;
  imageUrl: string;
  meta?: Record<string, unknown>;
}
```

### BaseDefaults

```typescript
interface BaseDefaults {
  variant: string | null;                      // Default variant name (e.g. "snow")
  variantTraits: Record<string, string | null>; // Sub-category ID → default trait ID
  traits: Record<string, string | null>;        // Category ID → default trait ID
}
```

### BaseInfo

```typescript
interface BaseInfo {
  id: string;
  name: string;
  categories: CategoryMeta[];
  defaults: BaseDefaults;
}
```

### ProjectManifest

```typescript
interface ProjectManifest {
  name: string;
  bases: string[];
  defaultBase: string | null;
  hasPremades: boolean;
  defaultImageUrl: string | null;
}
```

---

## Animated Traits

For traits with frame-by-frame animation:

- Set `isAnimated: true`
- Set `imageUrl: null`
- Provide a `frames` array with each frame's index and image URL

```json
{
  "id": "eyes-sparkle",
  "name": "Sparkle",
  "isAnimated": true,
  "imageUrl": null,
  "frames": [
    { "index": 1, "imageUrl": "https://api.yourproject.com/static/eyes/sparkle/1.png" },
    { "index": 2, "imageUrl": "https://api.yourproject.com/static/eyes/sparkle/2.png" },
    { "index": 3, "imageUrl": "https://api.yourproject.com/static/eyes/sparkle/3.png" }
  ],
  "blockedBy": [],
  "require": [],
  "multiTrait": []
}
```

The editor will cycle through frames to display the animation.

---

## Trait Dependencies

Traits can declare relationships with other traits using their IDs:

| Field | Behavior |
|-------|----------|
| `blockedBy` | This trait **cannot** be selected if any listed trait is active. Example: a full-face mask blocks glasses. |
| `require` | This trait **can only** be selected if all listed traits are active. Example: a visor requires a helmet. |
| `multiTrait` | Selecting this trait **also selects** all listed traits as a bundle. |

All three fields use trait IDs (e.g. `"headgear-helmet"`). The editor enforces these rules in the UI.

---

## The `meta` Field

`meta` is an **optional, freeform object** for project-specific data that the editor does not use directly. Put anything here that your project needs — the editor will preserve it but won't act on it.

Common uses:

```json
{
  "meta": {
    "rarity": "legendary",
    "chance": 5,
    "trainingTags": ["ai", "tag", "data"],
    "artist": "studio_name",
    "season": 2
  }
}
```

If you have no extra data, omit the field entirely.

---

## Errors

Return standard HTTP status codes with a JSON error body:

```json
{ "error": "Category 'hats' not found for base 'human'" }
```

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `404` | Resource not found (bad base, category, trait, or variant name) |
| `401` | Unauthorized (if your API requires authentication) |
| `500` | Server error |

---

## Image Hosting

All `imageUrl` values must be **fully qualified URLs** that the editor can load directly in an `<img>` tag. You can host images however you like — static file server, CDN, S3, etc. — as long as:

1. URLs are absolute (not relative paths)
2. Images are accessible cross-origin (proper CORS headers)
3. Images are PNGs with transparent backgrounds

---

## Health Check

### `GET /health`

Returns server status. **No authentication required.** Use this for load balancer health probes or uptime monitors.

**Response**

```json
{ "status": "ok" }
```

---

## API Documentation

### `GET /docs`

Returns this API specification as a Markdown file. **No authentication required.** Use this to allow agents and tools to read the spec programmatically.

**Response:** `text/markdown` body containing the contents of `API_SPEC.md`.

---

## Response Compression

All JSON responses support **gzip compression**. Clients that send `Accept-Encoding: gzip` will receive compressed responses with `Content-Encoding: gzip` header. This significantly reduces payload size for large endpoints like `/bases/:base/tree`.

---

## Composite Render

### `POST /render` — Render Composited Avatar

Layers selected traits into a single PNG image, using `zIndex` from category metadata to determine stacking order (lowest on bottom, highest on top).

All trait images are expected to be **1600×1600 RGBA PNGs**, pre-aligned for compositing.

**Request body**

```json
{
  "base": "yogicat",
  "traits": ["eyes-hi-blush", "headgear-baby-beanie", "top-90s-sweater"],
  "variant": "cute",
  "variantTraits": ["pattern-belly", "arms-brrr"],
  "width": 512,
  "height": 512
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `base` | `string` | Yes | Base body type (e.g. `"yogicat"`, `"shiba"`) |
| `traits` | `string[]` | Yes | Trait IDs from regular categories (eyes, headgear, etc.) |
| `variant` | `string` | No | Variant name (e.g. `"cute"`, `"boss"`) |
| `variantTraits` | `string[]` | No | Variant sub-trait IDs (e.g. pattern, arms). Requires `variant`. |
| `width` | `number` | No | Output width in pixels (1–4096, default 1600) |
| `height` | `number` | No | Output height in pixels (1–4096, default 1600) |

**Response:** `image/png` binary

**Compositing order** is determined by `zIndex` from `categories.json`:

**Note:** Backgrounds are **project-level** resources stored at `traits/background/` (not per-base). They are automatically shared across all bases — every base will include a `background` category with `order: -1` and `zIndex: -1`.

| zIndex | Category | Layer role |
|--------|----------|------------|
| -1 | background | Background image — bottom-most layer (project-level, shared across all bases) |
| 0 | variant | Body base (pattern + arms) |
| 1 | ears | Behind/part of head |
| 2 | top | Clothing on body |
| 3 | chain | Over clothing |
| 4 | nose | On face |
| 5 | mouth | On face |
| 6 | eyes | On face, above nose/mouth |
| 7 | faceart | Decorations over face features |
| 8 | glasses | Over eyes |
| 9 | headgear | Top of everything |

Variant sub-traits are composited at the variant's base zIndex plus a per-sub-category offset (e.g. zIndex 0 + 0.01 × sub-category zIndex), so sub-categories like `pattern` (zIndex 0) render below `arms` (zIndex 1) within the variant layer.

**Error responses**

| Status | Meaning |
|--------|---------|
| `400` | Invalid or missing required fields |
| `422` | Trait ID not found, image file missing, or render failure |

```json
{ "error": "Trait not found: eyes-nonexistent" }
```

**Notes:**
- Only static (non-animated) traits can be rendered. Animated traits are not supported.
- Compositing always happens at native 1600×1600 resolution, then resizes to the requested dimensions.
- Trait IDs are resolved by scanning each category's `data.json` — the ID must match exactly.

---

## Summary

| Endpoint | Method | Response Type | Auth Required |
|----------|--------|--------------|---------------|
| `/health` | GET | `{ status: "ok" }` | No |
| `/docs` | GET | `text/markdown` | No |
| `/` | GET | `ProjectManifest` | Yes |
| `/bases` | GET | `string[]` | Yes |
| `/bases/:base` | GET | `BaseInfo` | Yes |
| `/bases/:base/tree` | GET | `TraitTree` | Yes |
| `/bases/:base/categories/:cat` | GET | `CategoryResponse` | Yes |
| `/bases/:base/categories/:cat/:id` | GET | `TraitItem` | Yes |
| `/bases/:base/variants` | GET | `VariantDetail[]` | Yes |
| `/bases/:base/variants/:variant` | GET | `VariantDetail` | Yes |
| `/icons` | GET | `{ categories, utility }` | Yes |
| `/premades` | GET | `PremadeItem[]` | Only if `hasPremades: true` |
| `/render` | POST | `image/png` binary | Yes |
