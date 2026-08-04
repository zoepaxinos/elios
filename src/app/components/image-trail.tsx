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
