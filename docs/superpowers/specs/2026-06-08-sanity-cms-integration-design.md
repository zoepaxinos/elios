# Sanity CMS Integration + Visual Editing — Design Spec

## Overview

Connect the Elio's website to Sanity CMS so content is editable from Sanity Studio, and add Presentation (visual editing) so editors can click elements on the live site and edit them inline.

## What's Editable from Sanity

| Section | Editable Content | Schema |
|---------|-----------------|--------|
| Navigation | Nav item labels and anchor links | `navigation` (new) |
| About | Polaroid/graphic image, heading, body text | `aboutSection` (new) |
| Menu | Section heading, structured items (name, price, description, dietary) + uploadable menu page images | `menuCategory` (existing), `menuItem` (existing), `menuPage` (new) |
| Catering | Section heading, rich text block + contact info | `cafeInfo` (updated — add catering fields) |
| Contact | Section heading, address, phone, email, hours | `cafeInfo` (existing) |
| Announcements | Banner text + active toggle | `announcement` (existing) |

## What Stays Hardcoded

- All stickers and their positions
- Hero logo
- Footer logo

## Schema Changes

### New: `navigation`
- `items` — array of objects, each with `label` (string) and `href` (string)

### New: `aboutSection`
- `heading` — string (e.g. "About Us")
- `body` — block content (portable text / rich text)
- `image` — image field with hotspot (the polaroid graphic)

### New: `menuPage`
- `title` — string (e.g. "Food Menu", "Drinks Menu")
- `image` — image field (the uploadable menu page scan/photo)
- `order` — number (display order)

### Updated: `cafeInfo`
- Add `cateringHeading` — string (e.g. "Catering")
- Add `cateringText` — block content (portable text / rich text)
- Add `contactHeading` — string (e.g. "Contact")
- Add `menuHeading` — string (e.g. "Our Menu")
- All existing fields remain (name, tagline, about, address, phone, email, hours, instagram, heroImage, logo)

### Existing (no changes)
- `menuCategory` — title, description, order
- `menuItem` — name, description, price, category, image, dietary, available
- `announcement` — text, active

## Visual Editing Setup

### Packages
- `@sanity/presentation` — adds Presentation tool to Sanity Studio
- `@sanity/visual-editing` — click-to-edit overlays on the live site

### Implementation
1. Add Presentation tool to `sanity.config.ts`
2. Create `/api/draft-enable` and `/api/draft-disable` route handlers for draft mode
3. Add `<VisualEditing />` component to root layout (only renders in draft mode)
4. Add `data-sanity` attributes to editable elements so the visual editor knows what to target
5. Update data fetching to use `client.fetch()` with draft-aware perspective

### How It Works
- Editor opens Sanity Studio → clicks "Presentation" tool
- Studio loads the live site in an iframe
- Editor clicks any editable element on the site
- Studio opens the corresponding document/field for editing
- Changes appear live in the preview before publishing

## Data Flow

```
Sanity Studio → Edit content → Save draft
                                    ↓
                            Preview on site (draft mode)
                                    ↓
                            Publish → Live site updates
```

## Page Changes

### `page.tsx` (server component)
- Fetch `cafeInfo`, `menuCategories`, `menuItems`, `menuPages`, `aboutSection`, `announcement` from Sanity
- Pass data as props to `Hero` component

### `hero.tsx` (client component)
- Accept props for all editable content
- Replace hardcoded contact info with Sanity data
- Replace hardcoded catering text with Sanity rich text
- Replace static about graphic with Sanity image
- Replace static menu images with Sanity menu pages
- Add structured menu items display (from Sanity menuItem/menuCategory)
- Keep all stickers, animations, and layout as-is

### `layout.tsx`
- Conditionally render `<VisualEditing />` when in draft mode

## File Structure

```
src/
  app/
    api/
      draft-enable/route.ts    ← new
      draft-disable/route.ts   ← new
    page.tsx                   ← updated (fetch from Sanity)
    hero.tsx                   ← updated (accept props)
    layout.tsx                 ← updated (add VisualEditing)
    studio/[[...tool]]/
      page.tsx                 ← existing
      layout.tsx               ← existing
  sanity/
    client.ts                  ← existing
    env.ts                     ← existing
    image.ts                   ← existing
    queries.ts                 ← updated (add new queries)
    schemas/
      index.ts                 ← updated
      cafeInfo.ts              ← updated (add cateringText)
      menuCategory.ts          ← existing
      menuItem.ts              ← existing
      menuPage.ts              ← new
      aboutSection.ts          ← new
      announcement.ts          ← existing
sanity.config.ts               ← updated (add Presentation tool)
```

## Environment Variables

Existing (no changes needed):
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`

New:
- `SANITY_API_READ_TOKEN` — for draft mode (server-side only, not NEXT_PUBLIC)
