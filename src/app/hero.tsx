"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import ImageTrail, { type TrailItem } from "./components/image-trail";

/* ── Animation ── */
const pop = { type: "spring" as const, stiffness: 420, damping: 32 };

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

/* ── Mobile hero sticker spine (under sm only) — vertical cascade down the right edge ── */
const mobileSpine: { src: string; w: number; rot: number; right: number; dy?: number; outlined?: boolean }[] = [
  { src: "sticker-cannoli", w: 180, rot: 8, right: 78, dy: 10 },
  { src: "sticker-16", w: 170, rot: -5, right: -6, dy: -140 },
  { src: "sticker-6", w: 171, rot: 7, right: -16, dy: -90 },
  { src: "sticker-moka", w: 122, rot: -6, right: 230, dy: 120 },
  { src: "sticker-cocoa-v2", w: 136, rot: 6, right: -10, dy: -80 },
  { src: "sticker-takeaway-cup", w: 114, rot: 6, right: 116, dy: -80 },
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
    <section
      ref={heroRef}
      className="relative text-white"
      style={{ minHeight: "100vh", backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}
    >

      {/* Sticker image trail (desktop only) — replaces the former static collage.
         Layering is deliberate and explicit rather than DOM-order dependent:
         nav z-10000 > trail z-9999 > logo and byline z-9998. The trail sweeps
         over the logo, but stays under the nav so it remains usable.
         The wrapper is pointer-events-none, so it never intercepts clicks. */}
      <div className="hidden sm:block absolute inset-0 z-[9999] pointer-events-none">
        <ImageTrail items={heroTrailItems} surfaceRef={heroRef} />
      </div>


      {/* Central logo (desktop) */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...pop, delay: 0.25 }}
        className="hidden sm:block absolute z-[9998] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ top: "45%", width: "clamp(190px, 22.8vw, 342px)" }}
      >
        <Image src="/images/elios-hero-logo-new.png" alt="Elio's Panino Italiano" width={1000} height={520} className="w-full h-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" priority />
      </motion.div>

      {/* Hero tagline (desktop) — sits under the central logo.
         The logo is centred on 45% and its height tracks its clamped width
         (aspect 1000x520), so the offset below clamps in step with it. */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="hidden sm:block absolute z-[9998] left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
        style={{
          top: "calc(45% + clamp(70px, calc(5.93vw + 22px), 111px))",
          fontFamily: "var(--font-work-sans), sans-serif",
          fontSize: "clamp(22px, 2.4vw, 36px)",
          lineHeight: 0.94,
          letterSpacing: "-0.045em",
          color: "#FFFFDC",
          textShadow: "0 2px 4px rgba(0,0,0,0.4)",
        }}
      >
        Walk in a customer.<br />
        <em className="italic">Leave as family.</em>
      </motion.h1>

      {/* Mobile hero — asymmetric: left text column + right sticker spine */}
      <div className="sm:hidden absolute inset-0 flex">
        {/* Left text column */}
        <div className="w-[64%] shrink-0 relative z-10 flex flex-col justify-center items-start pl-7 pr-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src="/images/elios-wordmark.png" alt="Elio's" width={3225} height={922} className="w-[200px] h-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" priority />
            <p
              className="mt-2.5 uppercase"
              style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", fontSize: "14px", letterSpacing: "0.1em", color: "#FFFFDC" }}
            >
              Panino Italiano
            </p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6"
            style={{ fontFamily: "var(--font-work-sans), sans-serif", fontSize: "22.7px", lineHeight: 0.94, letterSpacing: "-0.045em", color: "#FFFFDC", textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}
          >
            Walk in a customer.<br />
            <em className="italic">Leave as family.</em>
          </motion.h1>
        </div>

        {/* Right sticker spine */}
        <div className="flex-1 min-w-0 relative z-10 flex flex-col items-end justify-evenly py-2 pointer-events-none">
          {mobileSpine.map((s, i) => (
            <motion.div
              key={s.src}
              initial={{ opacity: 0, scale: 0.8, rotate: s.rot }}
              animate={{ opacity: 1, scale: 1, rotate: s.rot }}
              transition={{ ...pop, delay: 0.15 + i * 0.08 }}
              style={{ width: `${s.w}px`, marginRight: `${s.right}px`, marginTop: s.dy ? `${s.dy}px` : undefined }}
            >
              <Image src={`/images/${s.src}.png`} alt="" width={s.w} height={s.w} sizes={`${s.w}px`} className={`w-full h-auto ${s.outlined ? "sticker-outlined" : "sticker-shadow"}`} draggable={false} />
            </motion.div>
          ))}
        </div>

        {/* Standalone family polaroid — bottom-right */}
        <motion.div
          initial={{ opacity: 0, y: 12, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: -4 }}
          transition={{ ...pop, delay: 0.5 }}
          className="absolute bottom-[76px] -right-[38px] w-[176px] drop-shadow-xl pointer-events-none z-0"
        >
          <Image src="/images/hero-polaroid.png" alt="" width={885} height={1020} sizes="168px" className="w-full h-auto" />
        </motion.div>
      </div>

    </section>

    </div>
  );
}
