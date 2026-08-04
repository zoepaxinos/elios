# Hero Image Trail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the desktop hero's static draggable sticker collage with a cursor-driven image trail that preserves Elio's transparent cut-out sticker aesthetic.

**Architecture:** Vendor a trimmed copy of ReactBits `ImageTrail` (variant 1 only) into `src/app/components/image-trail.tsx`, adapted in three ways: render transparent `<img>` instead of cover-cropped backgrounds, attach pointer listeners to a caller-supplied surface element so the trail container stays click-through, and add real teardown. Mount it in `hero.tsx` behind desktop + reduced-motion guards, replacing the `stickerLayout` render block.

**Tech Stack:** Next.js 16.2.6 (App Router, Turbopack), React 19.2.4, TypeScript, Tailwind CSS v4, GSAP 3.13 (new), framer-motion 12 (existing, untouched by this work).

**Source spec:** `docs/superpowers/specs/2026-08-04-hero-image-trail-design.md`

## Global Constraints

- **Mobile must not change.** `mobileSpine` and the entire `sm:hidden` hero block are out of scope. Any visual diff at viewport < 640px is a failure.
- **Variant 1 only.** Scale + fade, 0.4s, no rotation, no filters. Do not port variants 2–8.
- **Resting state is empty.** No anchor stickers. Logo + tagline only when the trail is idle.
- **Z-order is fixed:** nav `z-[10000]`, logo and desktop tagline `z-[9999]`, trail container `z-[10]`.
- **GSAP version floor:** `gsap@^3.13.0`.
- **Trail container and all descendants are `pointer-events: none`.** Nav and menu links sit above the hero and must stay clickable.
- **All trail images route through the Next image optimiser.** No raw `/images/*.png` in trail `src` attributes.
- **This repo has no test framework.** `package.json` scripts are `dev`, `build`, `start`, `lint` only — there is no jest/vitest/playwright and this plan does not add one. Every task's verification uses executable commands (`tsc`, `eslint`, `next build`, `curl` + HTML assertions) plus explicitly-scripted manual browser checks. Do not write `.test.ts` files; there is no runner to execute them.
- **Dev server** is assumed running via `yarn dev` on port 3000. If port 3000 is taken Next picks the next free port — adjust the `curl` commands accordingly.

## Spec Amendment (decided during planning)

The spec specified `items?: string[]`. Implementation requires `TrailItem[]` where
`TrailItem = { src, width, height }`.

**Why:** the adapted renderer uses `<img>` with auto height instead of a fixed
`aspect-[1.1]` box. `TrailImage` measures `getBoundingClientRect()` in its constructor,
which runs before the images have loaded — so height measures 0 and the first spawns are
mis-centred by half a sticker. Passing intrinsic dimensions lets the wrapper carry an
explicit `aspect-ratio`, giving a correct box at construction time and eliminating layout
shift. The 14 intrinsic sizes are embedded in Task 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app/components/image-trail.tsx` | **New.** Owns all trail behaviour: the GSAP engine, the DOM rendering, the optimiser URL construction, and the desktop/reduced-motion guards. Exports `ImageTrail` (default) and the `TrailItem` type. Nothing else in the app knows GSAP exists. |
| `src/app/hero.tsx` | **Modify.** Loses `stickerLayout` and its render block. Gains a `heroRef` on the hero `<section>`, the `heroTrailItems` data array, and the `<ImageTrail>` mount. |
| `package.json` | **Modify.** Adds `gsap`. |

---

## Task 1: Add the GSAP dependency

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `gsap` importable as `import { gsap } from "gsap"`, satisfying `^3.13.0`.

- [ ] **Step 1: Record the current build baseline**

Before adding anything, confirm the tree is green so a later failure is attributable.

```bash
cd /Users/zoepaxinos/elios
npx tsc --noEmit && echo "TSC_OK"
```

Expected: `TSC_OK`.

- [ ] **Step 2: Install gsap**

This repo uses npm (`package-lock.json` present, no `yarn.lock`). Use npm so the lockfile stays consistent — do **not** run `yarn add`, which would create a competing `yarn.lock`.

```bash
cd /Users/zoepaxinos/elios
npm install gsap@^3.13.0
```

- [ ] **Step 3: Verify the installed version satisfies the floor**

```bash
cd /Users/zoepaxinos/elios
node -e "
const v = require('gsap/package.json').version;
const [maj, min] = v.split('.').map(Number);
const ok = maj === 3 && min >= 13;
console.log('gsap', v, ok ? 'OK' : 'FAILS ^3.13.0');
process.exit(ok ? 0 : 1);
"
```

Expected: `gsap 3.13.x OK`, exit 0.

- [ ] **Step 4: Verify TypeScript types resolve**

GSAP ships its own types; there is no `@types/gsap` to install. Confirm the import typechecks.

```bash
cd /Users/zoepaxinos/elios
cat > /tmp/gsap-probe.ts <<'EOF'
import { gsap } from "gsap";
const v: gsap.TweenVars = { opacity: 0, scale: 0.2 };
export default v;
EOF
npx tsc --noEmit --esModuleInterop --moduleResolution bundler --module esnext --target es2020 /tmp/gsap-probe.ts && echo "TYPES_OK"
rm -f /tmp/gsap-probe.ts
```

Expected: `TYPES_OK` with no errors.

- [ ] **Step 5: Verify the app still typechecks and builds**

```bash
cd /Users/zoepaxinos/elios
npx tsc --noEmit && echo "TSC_OK"
```

Expected: `TSC_OK`.

- [ ] **Step 6: Commit**

```bash
cd /Users/zoepaxinos/elios
git add package.json package-lock.json
git commit -m "build: add gsap for hero image trail"
```

---

## Task 2: Create the adapted ImageTrail component

**Files:**
- Create: `src/app/components/image-trail.tsx`

**Interfaces:**
- Consumes: `gsap` from Task 1.
- Produces:
  - `export type TrailItem = { src: string; width: number; height: number }`
  - `export default function ImageTrail(props: { items: TrailItem[]; surfaceRef: React.RefObject<HTMLElement | null> }): JSX.Element`

  Task 3 imports both by exactly these names. `surfaceRef` accepts `HTMLElement | null`
  because `useRef<HTMLElement>(null)` in React 19 produces `RefObject<HTMLElement | null>`.

- [ ] **Step 1: Create the file**

Create `src/app/components/image-trail.tsx` with exactly this content:

```tsx
"use client";

import { gsap } from "gsap";
import { useEffect, useRef, type RefObject } from "react";

/**
 * Adapted from ReactBits ImageTrail (variant 1).
 * https://reactbits.dev/animations/image-trail
 *
 * Three deliberate departures from upstream:
 *
 * 1. Renders transparent <img> at native aspect instead of a cover-cropped
 *    `aspect-[1.1] rounded-[15px] overflow-hidden` box. Elio's stickers are
 *    cut-out PNGs spanning 0.65-1.67 aspect; cropping them to rounded
 *    rectangles destroys the look.
 * 2. Pointer listeners attach to a caller-supplied `surface` element, not to
 *    the trail container. A container that receives pointer events also
 *    swallows clicks on the nav layered above the hero.
 * 3. Real teardown. Upstream never removes listeners and never cancels its
 *    requestAnimationFrame loop, so React StrictMode (on by default in the App
 *    Router) leaves two live engines running in development.
 */

export type TrailItem = {
  /** Path under /public, e.g. "/images/sticker-3.png". */
  src: string;
  /**
   * Intrinsic pixel dimensions. Required, not optional: the wrapper uses these
   * for an explicit aspect-ratio so it has a correct measured height before the
   * image loads. Without it getBoundingClientRect() returns height 0 at
   * construction and early spawns are mis-centred.
   */
  width: number;
  height: number;
};

/** Rendered width of a trail image, in CSS px. */
const TRAIL_IMG_WIDTH = 190;
/** Optimiser width: TRAIL_IMG_WIDTH at 2x density, snapped to a Next default size. */
const TRAIL_IMG_OPTIMISED_WIDTH = 384;
/** Cursor travel (px) required before the next sticker spawns. Upstream default. */
const SPAWN_THRESHOLD = 80;
/** Tailwind `sm` breakpoint. Below this the trail does not run at all. */
const DESKTOP_QUERY = "(min-width: 640px)";

/**
 * Route through Next's image optimiser. The trail uses raw <img> (GSAP drives
 * the DOM nodes directly), so next/image's automatic optimisation does not
 * apply. Without this the hero would ship full-size PNGs - the largest here is
 * 1673x1964. Output is WebP/AVIF, both of which preserve alpha.
 */
function optimisedSrc(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${TRAIL_IMG_OPTIMISED_WIDTH}&q=75`;
}

function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b;
}

function getLocalPointerPos(e: MouseEvent, rect: DOMRect): { x: number; y: number } {
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function getMouseDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/** One trail image. Owns its measured rect and its own resize listener. */
class TrailImage {
  el: HTMLDivElement;
  rect: DOMRect;
  private onResize: () => void;

  constructor(el: HTMLDivElement) {
    this.el = el;
    this.rect = el.getBoundingClientRect();
    this.onResize = () => {
      gsap.set(this.el, { scale: 1, x: 0, y: 0, opacity: 0 });
      this.rect = this.el.getBoundingClientRect();
    };
    window.addEventListener("resize", this.onResize);
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    gsap.killTweensOf(this.el);
    gsap.set(this.el, { clearProps: "all" });
  }
}

/** Variant 1: spawn on threshold, drift to cursor, scale down and fade. */
class ImageTrailEngine {
  private container: HTMLElement;
  private surface: HTMLElement;
  private images: TrailImage[];
  private imgPosition = 0;
  private zIndexVal = 1;
  private activeImagesCount = 0;
  private isIdle = true;
  private mousePos = { x: 0, y: 0 };
  private lastMousePos = { x: 0, y: 0 };
  private cacheMousePos = { x: 0, y: 0 };
  private rafId: number | null = null;
  private handlePointerMove: (ev: MouseEvent) => void;
  private initRender: (ev: MouseEvent) => void;

  constructor(container: HTMLElement, surface: HTMLElement) {
    this.container = container;
    this.surface = surface;
    this.images = Array.from(
      container.querySelectorAll<HTMLDivElement>(".content__img"),
    ).map((el) => new TrailImage(el));

    this.handlePointerMove = (ev: MouseEvent) => {
      this.mousePos = getLocalPointerPos(ev, this.container.getBoundingClientRect());
    };

    this.initRender = (ev: MouseEvent) => {
      this.mousePos = getLocalPointerPos(ev, this.container.getBoundingClientRect());
      this.cacheMousePos = { ...this.mousePos };
      this.rafId = requestAnimationFrame(() => this.render());
      this.surface.removeEventListener("mousemove", this.initRender);
    };

    this.surface.addEventListener("mousemove", this.handlePointerMove);
    this.surface.addEventListener("mousemove", this.initRender);
  }

  private render() {
    const distance = getMouseDistance(this.mousePos, this.lastMousePos);
    this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
    this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

    if (distance > SPAWN_THRESHOLD) {
      this.showNextImage();
      this.lastMousePos = { ...this.mousePos };
    }
    if (this.isIdle && this.zIndexVal !== 1) {
      this.zIndexVal = 1;
    }
    this.rafId = requestAnimationFrame(() => this.render());
  }

  private showNextImage() {
    if (this.images.length === 0) return;
    ++this.zIndexVal;
    this.imgPosition =
      this.imgPosition < this.images.length - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];

    gsap.killTweensOf(img.el);
    gsap
      .timeline({
        onStart: () => {
          this.activeImagesCount++;
          this.isIdle = false;
        },
        onComplete: () => {
          this.activeImagesCount--;
          if (this.activeImagesCount === 0) this.isIdle = true;
        },
      })
      .fromTo(
        img.el,
        {
          opacity: 1,
          scale: 1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - img.rect.width / 2,
          y: this.cacheMousePos.y - img.rect.height / 2,
        },
        {
          duration: 0.4,
          ease: "power1",
          x: this.mousePos.x - img.rect.width / 2,
          y: this.mousePos.y - img.rect.height / 2,
        },
        0,
      )
      .to(img.el, { duration: 0.4, ease: "power3", opacity: 0, scale: 0.2 }, 0.4);
  }

  destroy() {
    this.surface.removeEventListener("mousemove", this.handlePointerMove);
    this.surface.removeEventListener("mousemove", this.initRender);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.images.forEach((img) => img.destroy());
    this.images = [];
  }
}

export default function ImageTrail({
  items,
  surfaceRef,
}: {
  items: TrailItem[];
  surfaceRef: RefObject<HTMLElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const surface = surfaceRef.current;
    if (!container || !surface) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia(DESKTOP_QUERY);

    let engine: ImageTrailEngine | null = null;

    // Re-evaluated on media change so resizing across the breakpoint, or
    // toggling the OS motion preference, starts or stops the engine cleanly.
    const sync = () => {
      const shouldRun = !reducedMotion.matches && desktop.matches;
      if (shouldRun && !engine) {
        engine = new ImageTrailEngine(container, surface);
      } else if (!shouldRun && engine) {
        engine.destroy();
        engine = null;
      }
    };

    sync();
    reducedMotion.addEventListener("change", sync);
    desktop.addEventListener("change", sync);

    return () => {
      reducedMotion.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
      engine?.destroy();
      engine = null;
    };
  }, [items, surfaceRef]);

  return (
    <div
      ref={containerRef}
      data-testid="image-trail"
      className="w-full h-full relative overflow-visible pointer-events-none"
    >
      {items.map((item) => (
        <div
          key={item.src}
          className="content__img absolute top-0 left-0 opacity-0 [will-change:transform,opacity]"
          style={{
            width: TRAIL_IMG_WIDTH,
            aspectRatio: `${item.width} / ${item.height}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- GSAP drives
              these nodes directly; next/image's wrapper markup and lazy
              behaviour conflict with that. Optimisation is preserved by
              routing through /_next/image in optimisedSrc(). */}
          <img
            src={optimisedSrc(item.src)}
            alt=""
            width={item.width}
            height={item.height}
            className="w-full h-full sticker-shadow"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
cd /Users/zoepaxinos/elios
npx tsc --noEmit && echo "TSC_OK"
```

Expected: `TSC_OK`.

- [ ] **Step 3: Verify it lints clean**

```bash
cd /Users/zoepaxinos/elios
npx eslint src/app/components/image-trail.tsx && echo "LINT_OK"
```

Expected: `LINT_OK` with no warnings. If `@next/next/no-img-element` still fires, the
disable comment is misplaced — it must sit immediately above the `<img>` element, inside
the JSX expression container.

- [ ] **Step 4: Verify the optimiser URL builder is correct**

The URL format matters: a malformed one silently 400s and every trail image is invisible.

```bash
cd /Users/zoepaxinos/elios
node -e "
const src = '/images/sticker-3.png';
const url = '/_next/image?url=' + encodeURIComponent(src) + '&w=384&q=75';
const expected = '/_next/image?url=%2Fimages%2Fsticker-3.png&w=384&q=75';
console.log(url);
if (url !== expected) { console.error('MISMATCH, expected', expected); process.exit(1); }
console.log('URL_OK');
"
```

Expected: `URL_OK`.

- [ ] **Step 5: Verify the optimiser actually serves these images**

With the dev server running:

```bash
cd /Users/zoepaxinos/elios
curl -s -o /dev/null -w "status=%{http_code} type=%{content_type} bytes=%{size_download}\n" \
  "http://localhost:3000/_next/image?url=%2Fimages%2Fsticker-3.png&w=384&q=75"
```

Expected: `status=200`, `type=image/webp` (or `image/avif`), and `bytes` far below the
source PNG. Compare against the raw file:

```bash
cd /Users/zoepaxinos/elios
ls -l public/images/sticker-3.png | awk '{print "raw PNG bytes:", $5}'
```

The optimised size must be smaller. If status is 400, the `url` parameter is not
correctly encoded.

- [ ] **Step 6: Commit**

```bash
cd /Users/zoepaxinos/elios
git add src/app/components/image-trail.tsx
git commit -m "feat: add adapted ImageTrail component for hero stickers"
```

---

## Task 3: Replace the hero collage with the trail

**Files:**
- Modify: `src/app/hero.tsx` — remove `stickerLayout` (currently lines 412–430) and its render block (currently lines 680–695); add import, `heroRef`, `heroTrailItems`, and the mount.

Line numbers shift as you edit. Anchor on the quoted text, not the numbers.

**Interfaces:**
- Consumes: `ImageTrail` (default export) and `TrailItem` (type) from Task 2.
- Produces: no new exports. `hero.tsx` has no default-export signature change.

- [ ] **Step 1: Add the import**

Find:

```tsx
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { urlFor } from "@/sanity/image";
```

Add immediately after:

```tsx
import ImageTrail, { type TrailItem } from "./components/image-trail";
```

- [ ] **Step 2: Replace the stickerLayout array with the trail data**

Find the whole block beginning `/* ── Sticker positions ── */` and ending at the `];`
that closes `stickerLayout` (the array whose first entry is `{ src: "sticker-3", w: 438, ... }`).

Do **not** touch `mobileSpine`, which is the *next* array in the file and ends at a
separate `];`. Deleting the wrong one breaks the mobile hero.

Replace the entire `stickerLayout` block with:

```tsx
/* ── Hero trail stickers ──
   The 14 stickers previously positioned in the desktop collage. Position,
   rotation, delay and pop-direction are gone: the trail derives placement from
   the cursor. Intrinsic width/height are required by ImageTrail so each
   wrapper can carry a correct aspect-ratio before the image loads. */
const heroTrailItems: TrailItem[] = [
  { src: "/images/sticker-3.png", width: 1134, height: 758 },
  { src: "/images/sticker-cannoli.png", width: 912, height: 1152 },
  { src: "/images/sticker-iced-coffee.png", width: 624, height: 932 },
  { src: "/images/sticker-12.png", width: 766, height: 838 },
  { src: "/images/sticker-6.png", width: 790, height: 710 },
  { src: "/images/sticker-10.png", width: 1288, height: 964 },
  { src: "/images/sticker-16.png", width: 1216, height: 1366 },
  { src: "/images/sticker-7.png", width: 966, height: 1002 },
  { src: "/images/sticker-moka.png", width: 992, height: 1064 },
  { src: "/images/sticker-cup.png", width: 1238, height: 1105 },
  { src: "/images/sticker-cocoa-v2.png", width: 1962, height: 1176 },
  { src: "/images/sticker-logo-badge.png", width: 492, height: 426 },
  { src: "/images/sticker-5.png", width: 1364, height: 1364 },
  { src: "/images/sticker-takeaway-cup.png", width: 1673, height: 1964 },
];
```

- [ ] **Step 3: Add the hero ref**

Inside the `Hero` component body, find:

```tsx
  const constraintRef = useRef<HTMLDivElement>(null);
```

Add immediately after:

```tsx
  // Pointer surface for the image trail. The trail's own container is
  // pointer-events:none so it cannot swallow clicks on the nav above it,
  // which means listeners must attach to something that does receive events.
  const heroRef = useRef<HTMLElement>(null);
```

- [ ] **Step 4: Attach the ref to the hero section**

Find (the first `<section>` in the returned JSX, immediately inside `<div ref={constraintRef} ...>`):

```tsx
    <section
      className="relative text-white"
```

Replace with:

```tsx
    <section
      ref={heroRef}
      className="relative text-white"
```

- [ ] **Step 5: Replace the sticker render block with the trail mount**

Find the block starting `{/* Stickers */}` and ending with the `))}` that closes
`stickerLayout.map`:

```tsx
      {/* Stickers */}
      {stickerLayout.map((s, i) => (
        <Draggable
```

Replace the entire block (from `{/* Stickers */}` through its closing `))}`) with:

```tsx
      {/* Sticker image trail (desktop only) — replaces the former static collage.
         z-[10] sits above the background but below the logo (z-9999) and nav (z-10000). */}
      <div className="hidden sm:block absolute inset-0 z-[10] pointer-events-none">
        <ImageTrail items={heroTrailItems} surfaceRef={heroRef} />
      </div>
```

- [ ] **Step 6: Verify no dangling references remain**

```bash
cd /Users/zoepaxinos/elios
echo "stickerLayout refs (expect 0):"; grep -c "stickerLayout" src/app/hero.tsx
echo "mobileSpine refs (expect 2 - definition + render):"; grep -c "mobileSpine" src/app/hero.tsx
echo "ImageTrail refs (expect 2 - import + mount):"; grep -c "ImageTrail" src/app/hero.tsx
```

Expected exactly: `0`, `2`, `2`. A `mobileSpine` count other than 2 means the wrong array
was deleted — revert and redo Step 2.

- [ ] **Step 7: Verify it typechecks and lints**

```bash
cd /Users/zoepaxinos/elios
npx tsc --noEmit && echo "TSC_OK"
npx eslint src/app/hero.tsx && echo "LINT_OK"
```

Expected: `TSC_OK` and `LINT_OK`.

`Draggable` is now referenced only by `PhotoPolaroid` and `InteractivePolaroid`, both of
which were already unused and unexported before this change. TypeScript will not error on
them. Leave all three in place — removing them is listed as a follow-up in the spec, not
part of this work.

- [ ] **Step 8: Verify all pages still render**

```bash
cd /Users/zoepaxinos/elios
for p in "" about contact menu studio; do
  printf "/%s -> " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/$p"
done
```

Expected: `200` for every path.

- [ ] **Step 9: Verify the rendered HTML**

Note on scoping: the mobile sticker spine renders six of these same stickers through
`next/image`, which also emits `/_next/image?url=%2Fimages%2Fsticker...` URLs. A
document-wide count of optimiser URLs would therefore overcount. These assertions scope
to the trail by matching the `content__img` class, which is unique to it.

```bash
cd /Users/zoepaxinos/elios
curl -s http://localhost:3000 | python3 -c "
import sys, re
h = sys.stdin.read()

# Each trail image is an <img> directly inside a .content__img wrapper.
# JSX comments emit nothing, so the tags are adjacent in the output.
trail_srcs = re.findall(r'class=\"content__img[^\"]*\"[^>]*>\s*<img[^>]*src=\"([^\"]+)\"', h)

container = re.search(r'<div[^>]*data-testid=\"image-trail\"[^>]*>', h)
wrapper = re.search(r'<div class=\"[^\"]*hidden sm:block[^\"]*z-\[10\][^\"]*pointer-events-none[^\"]*\">', h)

checks = [
    ('trail container present', bool(container)),
    ('container is pointer-events-none', bool(container) and 'pointer-events-none' in container.group(0)),
    ('desktop-only wrapper with z-10', bool(wrapper)),
    ('14 trail images', len(trail_srcs) == 14),
    ('all trail srcs use optimiser', bool(trail_srcs) and all(s.startswith('/_next/image?') for s in trail_srcs)),
    ('no raw png in trail', not any(s.startswith('/images/') for s in trail_srcs)),
    ('all trail srcs at w=384', bool(trail_srcs) and all('w=384' in s for s in trail_srcs)),
    ('mobile spine still rendered', 'sm:hidden' in h),
]

for name, ok in checks:
    print(('PASS' if ok else 'FAIL'), '-', name)
print('trail image count:', len(trail_srcs))
sys.exit(0 if all(ok for _, ok in checks) else 1)
"
```

Expected: all `PASS`, `trail image count: 14`, exit 0.

- [ ] **Step 10: Verify a production build succeeds**

Dev and production differ in image handling and minification; the build is the real gate.

```bash
cd /Users/zoepaxinos/elios
npx next build 2>&1 | tail -25
```

Expected: build completes, no errors. Warnings about the workspace root lockfile are
pre-existing and expected.

- [ ] **Step 11: Commit**

```bash
cd /Users/zoepaxinos/elios
git add src/app/hero.tsx
git commit -m "feat: replace desktop hero collage with cursor image trail"
```

---

## Task 4: Behavioural verification sweep

No code changes unless a check fails. This task exists because the repo has no automated
browser tests and these behaviours cannot be asserted from `curl` alone. Record each
result; a failure sends you back to Task 2 or 3.

**Files:**
- Modify (only if a check fails): `src/app/components/image-trail.tsx` or `src/app/hero.tsx`

**Interfaces:**
- Consumes: the mounted trail from Task 3.
- Produces: nothing.

- [ ] **Step 1: Confirm a single engine under StrictMode**

App Router enables StrictMode by default (`reactStrictMode` is unset in
`next.config.ts`; Next resolves `__NEXT_STRICT_MODE_APP` to `true`). Effects therefore
run twice in development. Without correct teardown this yields two engines and a doubled
spawn rate.

Temporarily add a counter to `ImageTrailEngine`'s constructor and `destroy()`:

```tsx
// TEMPORARY — remove after verifying
constructor(container: HTMLElement, surface: HTMLElement) {
  console.log("[trail] engine constructed");
  // ...existing body
}

destroy() {
  console.log("[trail] engine destroyed");
  // ...existing body
}
```

Load `http://localhost:3000` on a desktop-width viewport and read the console.

Expected: constructed/destroyed counts balance, leaving exactly one live engine. A
typical StrictMode sequence is construct → destroy → construct. Two constructs with no
destroy is a failure — teardown is not wired up.

**Remove both `console.log` lines before continuing.**

- [ ] **Step 2: Verify clicks pass through to the nav**

In the browser at desktop width, move the cursor across the hero to spawn stickers, then
click each nav link while stickers are visible on screen.

Expected: every nav link navigates. If a click is swallowed, the trail container or an
image is receiving pointer events — recheck that `pointer-events-none` is on both the
wrapper `<div>` in `hero.tsx` and the container in `image-trail.tsx`.

- [ ] **Step 3: Verify reduced-motion disables the trail**

Chrome DevTools → Rendering panel → *Emulate CSS media feature prefers-reduced-motion* →
`reduce`. Reload.

Expected: no stickers spawn on cursor movement. The hero shows logo + tagline only. No
console errors.

- [ ] **Step 4: Verify the mobile hero is unchanged**

Set the viewport to 390px wide and reload.

Expected: the mobile hero is pixel-identical to before this work — wordmark, "Panino
Italiano", the "Walk in a customer. / Leave as family." heading, the right-hand sticker
spine, and the family polaroid. No trail, and no trail listeners attached.

Confirm the trail container is not rendered at all:

```bash
cd /Users/zoepaxinos/elios
curl -s http://localhost:3000 | grep -c 'hidden sm:block absolute inset-0 z-\[10\]'
```

Expected: `1` — present in the HTML but hidden by CSS at mobile widths. This is expected;
the media query in the effect prevents the engine from ever initialising below 640px.

- [ ] **Step 5: Verify image payload has not regressed**

DevTools → Network → filter *Img* → hard reload at desktop width.

Expected: all 14 sticker requests go to `/_next/image?...`, none to `/images/*.png`, and
each response is WebP or AVIF. Record the total image transfer size.

Compare against the previous collage, which loaded the same 14 stickers through
`next/image`. Total should be broadly comparable — a large increase means the optimiser
routing is not working.

- [ ] **Step 6: Verify sticker silhouettes and centring**

Move the cursor slowly across the hero.

Expected: stickers appear with true cut-out silhouettes — no rounded corners, no
rectangular tile edges, no cropping. Wide stickers (`sticker-cocoa-v2`, 1962×1176) and
tall ones (`sticker-takeaway-cup`, 1673×1964) both keep their proportions. Each spawns
centred on the cursor, including the very first one after a hard reload — off-centre
early spawns mean the `aspect-ratio` box is not applying.

- [ ] **Step 7: Commit any fixes**

If Steps 1–6 all passed with no code change, skip this step — there is nothing to commit.

```bash
cd /Users/zoepaxinos/elios
git add -A src/app
git commit -m "fix: address image trail verification findings"
```

---

## Definition of Done

- [ ] `npx tsc --noEmit` clean.
- [ ] `npx eslint src/app/components/image-trail.tsx src/app/hero.tsx` clean.
- [ ] `npx next build` succeeds.
- [ ] `/`, `/about`, `/contact`, `/menu`, `/studio` all return 200.
- [ ] Task 3 Step 9 HTML assertions all PASS.
- [ ] Exactly one trail engine under StrictMode.
- [ ] Nav links clickable over the hero.
- [ ] Reduced-motion renders the bare hero, no listeners.
- [ ] Mobile hero visually unchanged at 390px.
- [ ] All 14 trail images served via `/_next/image`.
- [ ] Stickers render as true cut-outs, centred on the cursor from the first spawn.
- [ ] No `console.log` statements remain.

## Out of Scope

Recorded in the spec's "Known follow-ups"; do not address here:

- Dead code: `PhotoPolaroid`, `InteractivePolaroid`, `Draggable`, `constraintRef`.
- Unused assets: `sticker-tomato-can.png`, `sticker-13.png`, `sticker-4.png`,
  `sticker-contactus-receipts.png`.
- The orphaned `hideOnMobile` field.
- The Next workspace-root warning from `/Users/zoepaxinos/package-lock.json`.
