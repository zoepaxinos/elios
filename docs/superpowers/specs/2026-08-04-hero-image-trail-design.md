# Hero Image Trail — Design

**Date:** 2026-08-04
**Status:** Approved, ready for implementation planning
**Branch at time of writing:** `elios-menu-annotations`

## Summary

Replace the desktop hero's static draggable sticker collage with a cursor-driven image
trail, built on the ReactBits `ImageTrail` component (variant 1), adapted to preserve
Elio's transparent cut-out sticker aesthetic.

Mobile is explicitly out of scope and must not change.

## Goals

- Desktop hero stickers appear as a trail following the cursor, instead of a fixed collage.
- Stickers keep their true silhouettes, aspect ratios and drop shadow.
- No regression to page weight, click targets, or the mobile hero.

## Non-goals

- Any change to the mobile hero (`mobileSpine`, the `sm:hidden` block).
- Removing pre-existing dead code (`PhotoPolaroid`, `InteractivePolaroid`, and
  `Draggable` once orphaned). Tracked separately; see "Known follow-ups".
- Making the trail configurable in Sanity.

## Decisions

These were settled during brainstorming and are not open for reinterpretation
during implementation.

| Decision | Choice |
|---|---|
| Collage vs trail | **Replace** the desktop collage entirely |
| Sticker rendering | **Adapt** the component to preserve transparent cut-outs |
| Resting state | **Fully empty** — logo + tagline only; no anchor stickers |
| Variant | **Variant 1** — scale + fade, 0.4s, no rotation, no filters |
| Integration | **Vendor a trimmed, adapted copy** (approach A) |
| Mobile | **Unchanged** |

## Architecture

Three touchpoints:

| File | Change |
|---|---|
| `src/app/components/image-trail.tsx` | New. Adapted ReactBits variant 1, ~150 lines |
| `src/app/hero.tsx` | Remove `stickerLayout` + render block; mount `<ImageTrail>` |
| `package.json` | Add `gsap@^3.13.0` |

### Why vendored rather than installed

ReactBits ships as copy-paste source, not an npm package. Upstream `ImageTrail.tsx` is
1216 lines covering 8 variants. We keep only variant 1's class, so the vendored file is
roughly 150 lines. This diverges from upstream permanently — future ReactBits updates
will not apply. That is an accepted cost.

## Component contract

```tsx
<ImageTrail
  items={string[]}                        // sticker image URLs
  surfaceRef={RefObject<HTMLElement>}     // element that receives pointer events
/>
```

- **`items`** — image URLs, already routed through the Next optimiser (see below).
- **`surfaceRef`** — the hero `<section>`. Listeners attach here, not to the trail
  container, so the container can stay `pointer-events: none`.

Renders a positioned container with one absolutely-positioned `<img>` per item, all
initially at `opacity: 0`.

### Three departures from upstream

**1. Rendering — preserve cut-outs.**

Upstream renders each image as a fixed box with a cover-cropped background:

```tsx
<div className="content__img w-[190px] aspect-[1.1] rounded-[15px] overflow-hidden ...">
  <div className="content__img-inner bg-center bg-cover ..." style={{ backgroundImage: `url(${url})` }} />
</div>
```

That crops every sticker into a rounded rectangle. Elio's stickers are transparent PNGs
spanning aspect ratios 0.65–1.67; cover-cropping destroys them.

Adapted:

```tsx
<div className="content__img absolute top-0 left-0 opacity-0 w-[190px] [will-change:transform,opacity]">
  <img src={url} alt="" className="w-full h-auto sticker-shadow" draggable={false} />
</div>
```

Fixed width, auto height, no rounding, no `overflow-hidden`, transparent background,
reusing the existing `.sticker-shadow` filter from `globals.css`.

Because heights now vary per sticker, any centring maths must read each element's own
measured rect rather than assuming a shared height. Upstream already measures per-item
rects, so this works — but it must be verified, not assumed.

**2. Listener surface — keep clicks working.**

Upstream attaches `mousemove`/`touchmove` to its own container. A container that receives
pointer events also swallows clicks on anything beneath it, which would break the nav and
menu links layered over the hero.

The adapted constructor takes two elements: the container (for positioning maths and
`getBoundingClientRect`) and the surface (for listeners). The container and all its
children stay `pointer-events: none`.

**3. Teardown — fixes an upstream bug.**

Upstream:

```tsx
useEffect(() => {
  if (!containerRef.current) return;
  const Cls = variantMap[variant] || variantMap[1];
  new Cls(containerRef.current);
}, [variant, items]);
```

No cleanup function. Listeners registered in the constructor are never removed, and
in-flight GSAP tweens are never killed. Under React StrictMode in development the effect
runs twice, producing two live trail instances and doubled spawn rates.

The adapted class exposes `destroy()` which removes all listeners (including the
`window` resize handler registered per `ImageItem`) and calls `gsap.killTweensOf` on
every element. The effect returns it as cleanup.

Touch listeners are dropped entirely — the component is desktop-only.

## Hero integration

### Removed

- The `stickerLayout` const and its inline type annotation.
- The `{stickerLayout.map(...)}` block rendering 14 `<Draggable>` wrappers.

### Retained deliberately

`Draggable`, `PhotoPolaroid`, `InteractivePolaroid` and `constraintRef` all stay.
`PhotoPolaroid` and `InteractivePolaroid` were already unused and unexported before this
change; `Draggable` becomes orphaned but is still referenced by them. Removing them is a
separate decision.

### Added

Inside the hero `<section>`, which gains a ref used as the pointer surface:

```tsx
<div className="hidden sm:block absolute inset-0 z-[10] pointer-events-none">
  <ImageTrail items={heroTrailStickers} surfaceRef={heroRef} />
</div>
```

**Z-order.** Nav is `z-[10000]`, the central logo and desktop tagline are `z-[9999]`.
`z-[10]` puts the trail above the background and below all of them.

**`hidden sm:block`** means the container never renders on mobile.

### Trail contents

The 14 stickers currently in `stickerLayout`, which are already curated for the hero:

```
sticker-3, sticker-cannoli, sticker-iced-coffee, sticker-12, sticker-6,
sticker-10, sticker-16, sticker-7, sticker-moka, sticker-cup,
sticker-cocoa-v2, sticker-logo-badge, sticker-5, sticker-takeaway-cup
```

Moved into a plain `const heroTrailStickers: string[]` — position, rotation, delay and
pop-direction metadata are all discarded, since the trail derives placement from the
cursor.

## Image optimisation

The trail renders raw `<img>`, bypassing `next/image`. Unmitigated this ships full-size
PNGs — the largest in the trail set, `sticker-takeaway-cup.png`, is 1673×1964, and
`sticker-cocoa-v2.png` is 1962×1176 — which would regress a hero that currently serves
properly sized images.

Each URL is therefore built against Next's image optimiser:

```
/_next/image?url=%2Fimages%2Fsticker-3.png&w=384&q=75
```

- `w=384` matches the ~190px render width at 2× density.
- Output is WebP/AVIF, both of which preserve the alpha channel the cut-outs require.
- Local `public/` paths need no `next.config.ts` domain allowlisting.
- URLs must be `encodeURIComponent`-escaped.

Note that all 14 `<img>` elements exist in the DOM from mount at `opacity: 0`, so the
browser fetches them on mount rather than on first spawn. Native `loading="lazy"` is
unreliable for absolutely-positioned zero-opacity elements and should not be relied on.
This is precisely why the optimiser routing matters: 14 unoptimised PNGs would land on
initial hero load. Total optimised payload should be measured during implementation and
compared against the current collage, which loads the same 14 images via `next/image`.

## Guards

Both checked before initialising, via `matchMedia`:

1. `(prefers-reduced-motion: reduce)` — skip entirely. A cursor-tracking trail is a
   strong vestibular trigger. Fallback is the bare hero.
2. `(min-width: 640px)` — skip below Tailwind's `sm` breakpoint, so listeners never
   attach on mobile even if the container were somehow visible.

Both are re-evaluated on change so a window resize across the breakpoint behaves
correctly.

## Accepted consequences

**The hero is empty at rest.** Logo and tagline on the green background — before any
mouse movement, after the trail fades, under reduced-motion, and for anyone who never
moves the cursor. This was chosen explicitly over keeping anchor stickers. It is the
single highest-risk aspect of the design and should be reviewed visually before merge.

**A second animation library.** GSAP joins framer-motion. GSAP core is roughly 70KB
minified and is free for commercial use under its current licence.

**Permanent divergence from upstream ReactBits.**

## Verification

- `npx tsc --noEmit` clean.
- `/`, `/about`, `/contact` all return 200.
- Rendered HTML: trail container present, carries `pointer-events-none` and `hidden sm:block`.
- Nav and menu links remain clickable over the hero region.
- Exactly one trail instance initialises under StrictMode in dev.
- Reduced-motion emulation renders the hero with no trail and no attached listeners.
- Mobile viewport: hero visually identical to before the change.
- Network panel: trail images served from `/_next/image`, not raw PNG paths.

## Known follow-ups

Not part of this work:

- Dead code cleanup: `PhotoPolaroid`, `InteractivePolaroid`, `Draggable`, `constraintRef`.
- Unused image assets accumulated earlier: `sticker-tomato-can.png`, `sticker-13.png`,
  `sticker-4.png`, `sticker-contactus-receipts.png`.
- The `hideOnMobile` field on the removed sticker type, now unused.
- Next workspace-root warning from the stray `/Users/zoepaxinos/package-lock.json`.
