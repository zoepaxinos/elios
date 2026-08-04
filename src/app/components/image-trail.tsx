"use client";

import { gsap } from "gsap";
import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Adapted from ReactBits ImageTrail (variant 1).
 * https://reactbits.dev/animations/image-trail
 *
 * Five deliberate departures from upstream:
 *
 * 1. Renders transparent <img> at native aspect instead of a cover-cropped
 *    `aspect-[1.1] rounded-[15px] overflow-hidden` box. Elio's stickers are
 *    cut-out PNGs spanning 0.65-1.67 aspect; cropping them to rounded
 *    rectangles destroys the look.
 * 2. Pointer listeners attach to a caller-supplied `surface` element, not to
 *    the trail container. A container that receives pointer events also
 *    swallows clicks on the nav layered above the hero.
 * 3. Real teardown. Upstream never removes listeners, never cancels its
 *    requestAnimationFrame loop and never kills its timelines, so React
 *    StrictMode (on by default in the App Router) leaves two live engines
 *    running in development.
 * 4. The item markup is gated on a React state flag rather than always
 *    rendered. Reduced-motion users and sub-640px viewports never see the
 *    trail, so they should not pay for 14 image requests either.
 * 5. The container rect is cached rather than measured per pointer event, and
 *    the rAF loop stops when nothing is animating and the cursor has settled.
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
  /**
   * Optional size multiplier against TRAIL_IMG_WIDTH. Defaults to 1. Use it to
   * bring an outsized or visually heavy sticker into line with the rest —
   * e.g. 0.6 renders it 40% smaller. The aspect-ratio box scales with it, so
   * measured height stays correct and spawns stay centred.
   */
  scale?: number;
  /**
   * Optional static tilt in degrees. Applied to the inner <img>, not the
   * wrapper — GSAP owns the wrapper's transform (x/y/scale), so rotating it
   * there would be overwritten on every spawn. Rotating the child sidesteps
   * that entirely. Centring still uses the wrapper's unrotated box, which
   * keeps spawn positioning consistent with untilted stickers.
   */
  rotate?: number;
};

/** Rendered width of a trail image, in CSS px. */
const TRAIL_IMG_WIDTH = 190;
/** Optimiser width: TRAIL_IMG_WIDTH at 2x density, snapped to a Next default size. */
const TRAIL_IMG_OPTIMISED_WIDTH = 384;
/** Cursor travel (px) required before the next sticker spawns. Upstream default. */
const SPAWN_THRESHOLD = 80;
/** Tailwind `sm` breakpoint. Below this the trail does not run at all. */
const DESKTOP_QUERY = "(min-width: 640px)";
/** Users who ask for less motion get none of this. */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/**
 * Sub-pixel threshold at which the eased cursor is treated as having caught up
 * with the real cursor. The lerp is asymptotic, so it never converges exactly.
 */
const SETTLE_EPSILON = 0.1;

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
    /* Clear only what this engine set. `clearProps: "all"` is implemented by
       GSAP's CSSPlugin as `style.cssText = ""`, which would also wipe the
       width and aspect-ratio React wrote inline - the wrapper's only sizing.
       React does not re-render on teardown, so those never come back and every
       subsequent spawn is measured at 0x0. */
    gsap.set(this.el, { clearProps: "transform,opacity,zIndex" });
  }
}

/** Variant 1: spawn on threshold, drift to cursor, scale down and fade. */
class ImageTrailEngine {
  private container: HTMLElement;
  private surface: HTMLElement;
  private images: TrailImage[];
  private timelines = new Set<gsap.core.Timeline>();
  private imgPosition = 0;
  private zIndexVal = 1;
  private activeImagesCount = 0;
  private isIdle = true;
  private hasPointer = false;
  private mousePos = { x: 0, y: 0 };
  private lastMousePos = { x: 0, y: 0 };
  private cacheMousePos = { x: 0, y: 0 };
  /**
   * Cached container rect. Measuring inside the pointer handler forces a
   * synchronous layout on every mousemove while GSAP is mutating transforms on
   * up to 14 `will-change` layers. The rect is viewport-relative and the hero
   * scrolls, so it is refreshed on both resize and scroll.
   */
  private rect: DOMRect;
  /** Non-null exactly while a rAF loop is scheduled. Doubles as the "loop is running" flag. */
  private rafId: number | null = null;
  private tick: () => void;
  private handlePointerMove: (ev: MouseEvent) => void;
  private measure: () => void;

  constructor(container: HTMLElement, surface: HTMLElement) {
    this.container = container;
    this.surface = surface;
    this.rect = container.getBoundingClientRect();
    this.images = Array.from(
      container.querySelectorAll<HTMLDivElement>(".content__img"),
    ).map((el) => new TrailImage(el));

    this.tick = () => this.render();

    this.measure = () => {
      this.rect = this.container.getBoundingClientRect();
    };

    this.handlePointerMove = (ev: MouseEvent) => {
      this.mousePos = getLocalPointerPos(ev, this.rect);
      if (!this.hasPointer) {
        // First sighting of the cursor: start the eased position on top of it,
        // otherwise the first sticker flies in from the container origin.
        this.hasPointer = true;
        this.cacheMousePos = { ...this.mousePos };
      }
      this.startLoop();
    };

    this.surface.addEventListener("mousemove", this.handlePointerMove);
    window.addEventListener("resize", this.measure, { passive: true });
    window.addEventListener("scroll", this.measure, { passive: true });
  }

  /**
   * Schedule the loop if it is not already scheduled. `rafId` is the single
   * source of truth: it is non-null from the moment a frame is requested until
   * render() decides to idle (or destroy() cancels), so two concurrent loops
   * cannot exist no matter how many pointer events arrive.
   */
  private startLoop() {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** True once the eased cursor has effectively caught up with the real one. */
  private hasSettled(): boolean {
    return (
      Math.abs(this.cacheMousePos.x - this.mousePos.x) < SETTLE_EPSILON &&
      Math.abs(this.cacheMousePos.y - this.mousePos.y) < SETTLE_EPSILON
    );
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

    // Nothing is animating and the cursor has stopped: park the loop instead of
    // burning a frame callback forever. handlePointerMove restarts it.
    // `timelines.size` covers the gap between a timeline being created here and
    // GSAP firing its onStart on the next tick, during which activeImagesCount
    // is still 0. The set drains itself: killTweensOf() empties a recycled
    // timeline, collapsing it to duration 0 so onComplete still fires.
    if (this.activeImagesCount === 0 && this.timelines.size === 0 && this.hasSettled()) {
      this.cacheMousePos = { ...this.mousePos };
      this.rafId = null;
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  }

  private showNextImage() {
    if (this.images.length === 0) return;
    ++this.zIndexVal;
    this.imgPosition =
      this.imgPosition < this.images.length - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];

    gsap.killTweensOf(img.el);
    const tl = gsap
      .timeline({
        onStart: () => {
          this.activeImagesCount++;
          this.isIdle = false;
        },
        onComplete: () => {
          this.activeImagesCount--;
          if (this.activeImagesCount === 0) this.isIdle = true;
          this.timelines.delete(tl);
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

    // Retained so destroy() can kill them. killTweensOf() on the child elements
    // does not stop the parent timeline, whose onStart/onComplete would keep
    // firing against a destroyed engine for up to 0.8s.
    this.timelines.add(tl);
  }

  destroy() {
    this.surface.removeEventListener("mousemove", this.handlePointerMove);
    window.removeEventListener("resize", this.measure);
    window.removeEventListener("scroll", this.measure);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.timelines.forEach((tl) => tl.kill());
    this.timelines.clear();
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
  /**
   * Whether the trail should run at all. Held in state, not read inline during
   * render, so the server and the first client render agree (no hydration
   * mismatch) and so flipping it re-renders the markup.
   */
  const [enabled, setEnabled] = useState(false);

  // Decide. Re-evaluated on media change, so resizing across the breakpoint or
  // toggling the OS motion preference both starts and stops the trail.
  useEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setEnabled(!reducedMotion.matches && desktop.matches);

    sync();
    reducedMotion.addEventListener("change", sync);
    desktop.addEventListener("change", sync);

    return () => {
      reducedMotion.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
    };
  }, []);

  /**
   * Run. Separate from the effect above and gated on `enabled` so ordering is
   * guaranteed by React itself: the engine queries `.content__img` in its
   * constructor, and this effect only executes for a render in which `enabled`
   * was already true - i.e. after React has committed those item divs to the
   * DOM. It can never observe zero elements.
   *
   * Exactly one engine exists at a time: the effect constructs one and its
   * cleanup destroys it, so any dependency change (or unmount, or StrictMode's
   * double invoke) tears the old one down before the next is built.
   */
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    const surface = surfaceRef.current;
    if (!container || !surface) return;

    const engine = new ImageTrailEngine(container, surface);
    return () => engine.destroy();
  }, [enabled, items, surfaceRef]);

  return (
    <div
      ref={containerRef}
      data-testid="image-trail"
      className="w-full h-full relative overflow-visible pointer-events-none"
    >
      {enabled &&
        items.map((item) => (
          <div
            key={item.src}
            className="content__img absolute top-0 left-0 opacity-0 [will-change:transform,opacity]"
            style={{
              width: TRAIL_IMG_WIDTH * (item.scale ?? 1),
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
              style={item.rotate ? { transform: `rotate(${item.rotate}deg)` } : undefined}
            />
          </div>
        ))}
    </div>
  );
}
