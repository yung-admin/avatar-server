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
5. `GET /premades` — load premade PFPs _(if `hasPremades` is true)_

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
  "hasPremades": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Your project's identifier |
| `bases` | `string[]` | Available base body types |
| `hasPremades` | `boolean` | Whether `/premades` has content |

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
    { "id": "skin",     "name": "Skin Tone", "order": 0, "zIndex": 0, "required": true  },
    { "id": "eyes",     "name": "Eyes",      "order": 1, "zIndex": 1, "required": true  },
    { "id": "hair",     "name": "Hair",      "order": 2, "zIndex": 5, "required": false },
    { "id": "hat",      "name": "Hat",       "order": 3, "zIndex": 6, "required": false },
    { "id": "glasses",  "name": "Glasses",   "order": 4, "zIndex": 7, "required": false },
    { "id": "variant",  "name": "Variant",   "order": 5, "zIndex": -1, "required": true }
  ]
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
interface CategoryMeta {
  id: string;        // Category identifier, used in URLs
  name: string;      // Display name
  order: number;     // UI display order (ascending)
  zIndex: number;    // Compositing layer order (higher = on top)
  required: boolean; // Must the user pick a trait from this category?
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
  id: string;         // e.g. "pattern", "arms", "marking" — you decide
  name: string;       // Display name
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

### ProjectManifest

```typescript
interface ProjectManifest {
  name: string;
  bases: string[];
  hasPremades: boolean;
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

## Summary

| Endpoint | Response Type | Required |
|----------|--------------|----------|
| `GET /` | `ProjectManifest` | Yes |
| `GET /bases` | `string[]` | Yes |
| `GET /bases/:base` | `BaseInfo` | Yes |
| `GET /bases/:base/tree` | `TraitTree` | Yes |
| `GET /bases/:base/categories/:cat` | `CategoryResponse` | Yes |
| `GET /bases/:base/categories/:cat/:id` | `TraitItem` | Yes |
| `GET /bases/:base/variants` | `VariantDetail[]` | Yes |
| `GET /bases/:base/variants/:variant` | `VariantDetail` | Yes |
| `GET /premades` | `PremadeItem[]` | Only if `hasPremades: true` |
