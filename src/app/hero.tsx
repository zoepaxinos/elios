"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import ImageTrail, { type TrailItem } from "./components/image-trail";

/* ── Animation ── */
const pop = { type: "spring" as const, stiffness: 420, damping: 32 };

/* How long each sticker holds before the next one appears. The swap itself is
   instantaneous — a hard cut with no fade or scale, so it reads as a flick
   through a stack rather than a dissolve. */
const FLICK_HOLD_MS = 900;

/* Base slot for one sticker in the mobile flick, before its own scale.
   Viewport-relative so the stickers stay proportionate across phone sizes, with
   a ceiling so they do not run away on a large tablet in portrait. Note several
   sticker PNGs carry transparent padding, so the visible subject is smaller
   than its slot — the slot is deliberately generous to compensate. */
const FLICK_BASE_CSS = "min(64vw, 300px)";

/**
 * Mobile-only tuning, keyed by src. The desktop trail and the mobile flick show
 * the same stickers but need different sizing: the trail scatters them across
 * the whole hero, the flick shows one at a time in a fixed box, so what reads
 * well in one does not in the other. Anything absent here uses its default.
 *
 * `hidden` drops a sticker from the mobile sequence without touching desktop.
 * Scales are relative to FLICK_BASE_PX, NOT to the sticker's desktop scale.
 */
type FlickItem = TrailItem & { polaroid?: boolean };

/* Polaroids folded into the mobile rotation alongside the stickers. Kept
   separate from heroTrailItems because the desktop cursor trail is stickers
   only. `polaroid` swaps the cut-out drop shadow for the softer one the
   polaroids use elsewhere — a sticker shadow traces the subject's silhouette,
   which looks wrong on a rectangular white frame. */
/* Stickers that appear only in the mobile rotation, never in the desktop cursor
   trail. Counted as stickers for the interleave, so they can sit next to a
   polaroid without breaking the no-two-polaroids-adjacent guarantee. */
const MOBILE_EXTRA_STICKERS: FlickItem[] = [
  { src: "/images/panini-receipts.png", width: 1260, height: 1620 },
];

const MOBILE_POLAROIDS: FlickItem[] = [
  { src: "/images/polaroid-bw-family-1.png", width: 885, height: 1020, polaroid: true },
  // Supplied as "bw family polaroids_2/4"; both are byte-identical to files
  // already in the repo, so they are referenced rather than copied in again.
  { src: "/images/catering-family-polaroid.png", width: 885, height: 1020, polaroid: true },
  { src: "/images/polaroid-bw-family-3.png", width: 885, height: 1020, polaroid: true },
  { src: "/images/hero-polaroid.png", width: 885, height: 1020, polaroid: true },
];

/**
 * Spread the polaroids through the stickers so no two polaroids are ever
 * adjacent — including across the loop boundary, since the sequence repeats.
 *
 * Strict one-for-one alternation is not possible here: there are far more
 * stickers than polaroids, so it would mean showing the same four polaroids
 * four times each per cycle. Spacing them evenly instead shows each once per
 * cycle while still guaranteeing a sticker between every pair.
 */
function interleavePolaroids(stickers: FlickItem[], polaroids: FlickItem[]): FlickItem[] {
  if (polaroids.length === 0) return stickers;
  const gap = Math.max(1, Math.ceil(stickers.length / polaroids.length));
  const out: FlickItem[] = [];
  let next = 0;

  stickers.forEach((s, i) => {
    out.push(s);
    if (next < polaroids.length && (i + 1) % gap === 0) out.push(polaroids[next++]);
  });
  // Any polaroids the spacing did not reach go on the end. The item before is
  // always a sticker, and the sequence restarts on a sticker, so the adjacency
  // guarantee holds around the loop.
  while (next < polaroids.length) out.push(polaroids[next++]);

  return out;
}

const MOBILE_FLICK: Record<string, { scale?: number; rotate?: number; hidden?: boolean }> = {
  "/images/sticker-12.png": { hidden: true },          // olive oil bottle
  "/images/sticker-logo-badge.png": { hidden: true },  // Elio's "E" badge
  "/images/sticker-cannoli.png": { scale: 1.2 },
  "/images/sticker-3.png": { scale: 1.2 },           // hand holding chips
  "/images/sticker-cocoa-v2.png": { scale: 1.01 },   // hand holding coffee shaker (1.264 less 20%)
  "/images/sticker-cup.png": { scale: 0.68 },        // green coffee cup (0.8 less 15%)
  "/images/sticker-card.png": { scale: 0.8, rotate: 24 }, // scopa playing card
  // Polaroids, all down 20% from default.
  "/images/polaroid-bw-family-1.png": { scale: 0.8 },
  "/images/catering-family-polaroid.png": { scale: 0.8 },
  "/images/polaroid-bw-family-3.png": { scale: 0.8 },
  "/images/hero-polaroid.png": { scale: 0.8 },
};

/**
 * Mobile stand-in for the desktop cursor trail: the same stickers, shown one at
 * a time in a fixed centred box. Touch devices have no cursor to drive a trail,
 * so the sequence runs on a timer instead.
 *
 * Each sticker gets its own square slot sized FLICK_BASE_PX x its MOBILE_FLICK
 * scale, and is object-contain within that slot. So stickers of very different
 * proportions (0.65 through 3.5) all stay centred on one point, while per-item
 * scale and rotation still apply. Slots are centred on each other rather than
 * stacked from a corner, so a larger sticker grows around the same centre.
 */
function MobileStickerFlick({ items }: { items: TrailItem[] }) {
  const visible = interleavePolaroids(
    [
      ...items.filter((i) => !MOBILE_FLICK[i.src]?.hidden),
      ...MOBILE_EXTRA_STICKERS,
    ],
    MOBILE_POLAROIDS,
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visible.length === 0) return;
    // A looping animation is a vestibular trigger; hold on the first sticker.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(
      () => setIndex((n) => (n + 1) % visible.length),
      FLICK_HOLD_MS,
    );
    return () => clearInterval(id);
  }, [visible.length]);

  if (visible.length === 0) return null;

  // The outer box fits the largest slot so nothing shifts the layout.
  const maxScale = Math.max(1, ...visible.map((i) => MOBILE_FLICK[i.src]?.scale ?? 1));
  const box = `calc(${FLICK_BASE_CSS} * ${maxScale})`;

  return (
    <div className="relative" style={{ width: box, height: box }}>
      {/* Every sticker stays mounted and only the current one is visible.
          Swapping the src on a single element would make each change wait on a
          network fetch the first time round, which shows as a blank frame — the
          opposite of instant. This way the change is a pure visibility toggle. */}
      {visible.map((it, i) => {
        const cfg = MOBILE_FLICK[it.src];
        const slot = `calc(${FLICK_BASE_CSS} * ${cfg?.scale ?? 1})`;
        return (
          <div
            key={it.src}
            className="absolute inset-0 flex items-center justify-center"
            style={{ visibility: i === index ? "visible" : "hidden" }}
            aria-hidden={i !== index}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: slot,
                height: slot,
                transform: cfg?.rotate ? `rotate(${cfg.rotate}deg)` : undefined,
              }}
            >
              <Image
                src={it.src}
                alt=""
                width={it.width}
                height={it.height}
                // This component only renders below the sm breakpoint, so the
                // slot is never far off the viewport width.
                sizes="100vw"
                className={`max-w-full max-h-full w-auto h-auto object-contain ${
                  it.polaroid ? "drop-shadow-xl" : "sticker-shadow"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Draggable element ── */
function Draggable({
  children,
  rotation,
  delay,
  initialZ,
  constraintRef,
  getNextZ,
  popFrom = "scale",
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  rotation: number;
  delay: number;
  initialZ: number;
  constraintRef: React.RefObject<HTMLDivElement | null>;
  getNextZ: () => number;
  popFrom?: "scale" | "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}) {
  const [z, setZ] = useState(initialZ);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  const initial =
    popFrom === "left"
      ? { x: -32, rotate: rotation - 15, opacity: 1, scale: 0.7 }
      : popFrom === "right"
        ? { x: 32, rotate: rotation + 15, opacity: 1, scale: 0.7 }
        : { scale: 0, rotate: rotation - 20, opacity: 1 };

  return (
    <motion.div
      drag={!isMobile}
      dragConstraints={isMobile ? undefined : constraintRef}
      dragElastic={0.15}
      dragMomentum={false}
      whileHover={isMobile ? undefined : { rotate: rotation + 8, scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 15 } }}
      whileDrag={isMobile ? undefined : { scale: 1.06, cursor: "grabbing" }}
      onDragStart={isMobile ? undefined : () => setZ(getNextZ())}
      initial={initial}
      animate={{ scale: 1, rotate: rotation, opacity: 1, x: 0 }}
      transition={{ ...pop, delay }}
      className={`absolute select-none ${isMobile ? "" : "cursor-grab active:cursor-grabbing"} ${className}`}
      style={{ ...style, zIndex: z }}
    >
      {children}
    </motion.div>
  );
}

/* ── Polaroid (pre-composited image) ── */
function PhotoPolaroid({
  src,
  rotation,
  delay,
  initialZ,
  constraintRef,
  getNextZ,
  popFrom = "scale",
  style,
}: {
  src: string;
  rotation: number;
  delay: number;
  initialZ: number;
  constraintRef: React.RefObject<HTMLDivElement | null>;
  getNextZ: () => number;
  popFrom?: "scale" | "left" | "right";
  style: React.CSSProperties;
}) {
  return (
    <Draggable
      rotation={rotation}
      delay={delay}
      initialZ={initialZ}
      constraintRef={constraintRef}
      getNextZ={getNextZ}
      popFrom={popFrom}
      style={style}
    >
      <Image src={src} alt="Elio's" width={408} height={491} sizes="408px" className="w-full h-auto drop-shadow-xl" draggable={false} />
    </Draggable>
  );
}

/* ── Interactive Polaroid (upload + sign) ── */
function InteractivePolaroid({
  constraintRef,
  getNextZ,
  delay,
  initialZ,
  rotation,
  style,
}: {
  constraintRef: React.RefObject<HTMLDivElement | null>;
  getNextZ: () => number;
  delay: number;
  initialZ: number;
  rotation: number;
  style: React.CSSProperties;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [z, setZ] = useState(initialZ);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      drag
      dragConstraints={constraintRef}
      dragElastic={0.15}
      dragMomentum={false}
      whileDrag={{ scale: 1.06, cursor: "grabbing" }}
      onDragStart={() => setZ(getNextZ())}
      initial={{ scale: 0, rotate: rotation + 20, opacity: 0 }}
      animate={{ scale: 1, rotate: rotation, opacity: 1 }}
      transition={{ ...pop, delay }}
      className="absolute cursor-grab active:cursor-grabbing select-none"
      style={{ ...style, zIndex: z }}
    >
      <div className="relative">
        <Image src="/images/polaroid-frame-empty.png" alt="" width={408} height={491} sizes="408px" className="w-full h-auto" draggable={false} />
        <div
          className="absolute inset-[8%_9%_22%_9%] overflow-hidden cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Your photo" className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full bg-[#f5f3ed] flex flex-col items-center justify-center gap-2 text-[#45403a]/40 group-hover:text-[#45403a]/60 transition-colors">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <span className="font-nav text-[10px] uppercase tracking-widest">Add your photo</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => setImage(reader.result as string);
              reader.readAsDataURL(file);
            }
          }} />
          <div className="absolute inset-0 shadow-[inset_0_2px_6px_3px_rgba(0,0,0,0.08)]" />
        </div>
        <div className="absolute bottom-[4%] left-[12%] right-[12%]">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="sign here..."
            maxLength={30}
            className="w-full bg-transparent border-none outline-none font-handwriting text-xl sm:text-2xl text-[#45403a]/70 placeholder:text-[#45403a]/25 text-center cursor-text"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Hero trail stickers ──
   The 14 stickers previously positioned in the desktop collage. Position,
   rotation, delay and pop-direction are gone: the trail derives placement from
   the cursor. Intrinsic width/height are required by ImageTrail so each
   wrapper can carry a correct aspect-ratio before the image loads. */
const heroTrailItems: TrailItem[] = [
  { src: "/images/sticker-3.png", width: 1134, height: 758, scale: 1.1 },
  { src: "/images/sticker-cannoli.png", width: 912, height: 1152, scale: 1.1 },
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
  { src: "/images/sticker-card.png", width: 613, height: 910, scale: 0.6, rotate: 34 },
  { src: "/images/sticker-piadina-v2.png", width: 1140, height: 892 },
  { src: "/images/sticker-tomato-single.png", width: 1024, height: 1024 },
  { src: "/images/sticker-loyalty-card.png", width: 729, height: 556 },
];

/* ── Main Hero ── */
export default function Hero() {
  const constraintRef = useRef<HTMLDivElement>(null);
  // Pointer surface for the image trail. The trail's own container is
  // pointer-events:none so it cannot swallow clicks on the nav above it,
  // which means listeners must attach to something that does receive events.
  const heroRef = useRef<HTMLElement>(null);
  const zCounter = useRef(1000);
  const getNextZ = () => ++zCounter.current;

  return (
    <div ref={constraintRef} className="relative overflow-x-hidden">
    {/* min-h-svh — the SMALL viewport height, i.e. the height with the browser
        chrome visible.

        100vh is the LARGE viewport (chrome hidden), so on landing the lower
        rows of the hero sit below the fold. dvh fixes that but is dynamic: it
        changes as the URL bar collapses during scroll, resizing the hero and
        reflowing everything below it — visible as scroll jank. svh gets the
        landing position right without ever changing value. On desktop all
        three units are identical. */}
    <section
      ref={heroRef}
      className="relative text-white min-h-svh"
      style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG-tile.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}
    >

      {/* Sticker image trail (desktop only) — replaces the former static collage.
         Layering is deliberate and explicit rather than DOM-order dependent:
         nav z-10000 > trail z-9999 > logo and byline z-9998. The trail sweeps
         over the logo, but stays under the nav so it remains usable.
         The wrapper is pointer-events-none, so it never intercepts clicks. */}
      <div className="hidden sm:block absolute inset-0 z-[9999] pointer-events-none">
        <ImageTrail items={heroTrailItems} surfaceRef={heroRef} />
      </div>


      {/* Hero lockup (desktop) — the tagline sits either side of the logo.
          On load both halves start tucked behind the logo and slide outward
          while the logo springs up, so the line appears to break apart around
          it. Percentage x offsets are relative to each half's own width, so
          the travel scales with the type rather than being a fixed distance.

          The whole lockup is one <h1>: splitting it into a heading plus a
          stray paragraph would leave assistive tech reading half a sentence. */}
      <motion.h1
        className="hidden sm:block absolute z-[9998] left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          // The wrapper is exactly the logo's width, so centring the wrapper
          // centres the LOGO on the page. The two text halves hang outside it
          // via right-full / left-full and therefore cannot pull it off centre,
          // however unequal their lengths.
          width: "clamp(190px, 22.8vw, 342px)",
          // Matches the contact details block: IBM Plex Mono, uppercase, 0.02em.
          // The old -0.045em tracking was tuned for Work Sans' proportional
          // letterforms and reads cramped on a monospace.
          fontFamily: "var(--font-plex-mono), monospace",
          // Flat 18px to match the nav items, rather than scaling with the
          // viewport as it did before.
          fontSize: "18px",
          lineHeight: 0.94,
          letterSpacing: "0.02em",
          color: "#FFFFDC",
          textShadow: "0 2px 4px rgba(0,0,0,0.4)",
        }}
      >
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...pop, delay: 0.25 }}
          className="block"
        >
          <Image src="/images/elios-wordmark.png" alt="Elio's Panino Italiano" width={3225} height={922} className="w-full h-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" priority />
        </motion.span>

        {/* Vertical centring uses inset-y-0 + flex rather than -translate-y-1/2:
            framer-motion writes its own inline transform for the x animation and
            would overwrite a Tailwind translate. */}
        <motion.span
          initial={{ x: "55%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-full inset-y-0 mr-[60px] flex items-center whitespace-nowrap uppercase"
        >
          Walk in a customer
        </motion.span>

        <motion.span
          initial={{ x: "-55%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-full inset-y-0 ml-[60px] flex items-center whitespace-nowrap uppercase"
        >
          {/* Decorative leading ellipsis, replacing the arrow that was here.
              aria-hidden so it is not announced — the heading should read
              "Walk in a customer … Leave as family" as one phrase, and a
              screen reader spelling out dots would break that. */}
          <span aria-hidden="true" className="mr-2 inline-block">
            ...
          </span>
          Leave as family
        </motion.span>
      </motion.h1>

      {/* Mobile hero — centred stack at two fifths, three fifths and four
          fifths of the viewport. The three rows are positioned by Tailwind
          translate on their wrappers; the framer-motion animations live on the
          inner elements, because framer writes its own inline transform and
          would otherwise overwrite the centring. */}
      <div className="sm:hidden absolute inset-0">
        {/* Logo — 2/5 down */}
        <div className="absolute left-0 right-0 top-[40%] -translate-y-1/2 flex justify-center px-6 z-0">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...pop, delay: 0.15 }}
            className="w-[190px]"
          >
            <Image src="/images/elios-wordmark.png" alt="Elio's Panino Italiano" width={3225} height={922} sizes="190px" className="w-full h-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" priority />
          </motion.div>
        </div>

        {/* Stickers — 3/5 down, above the logo in z-order */}
        <div className="absolute left-0 right-0 top-[60%] -translate-y-1/2 flex justify-center pointer-events-none z-10">
          <MobileStickerFlick items={heroTrailItems} />
        </div>

        {/* Tagline — 4/5 down */}
        <div className="absolute left-0 right-0 top-[80%] -translate-y-1/2 flex justify-center px-6 z-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="uppercase text-center"
            style={{
              fontFamily: "var(--font-plex-mono), monospace",
              fontSize: "18px",
              lineHeight: 1.35,
              letterSpacing: "0.02em",
              color: "#FFFFDC",
              textShadow: "0 2px 4px rgba(0,0,0,0.4)",
            }}
          >
            Walk in a customer,<br />
            Leave as family
          </motion.h1>
        </div>
      </div>

    </section>

    </div>
  );
}
