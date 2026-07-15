"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Nav from "./components/nav";
import Map from "./components/map";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/sanity/image";

/* ── Menu Book (side by side + lightbox with page nav) ── */
const defaultMenuPages = ["/images/menu-2.png", "/images/menu-1.png"];

/* Tri-fold panels in reading order: cover → panini caldi → panini freschi →
   9:30am menu → coffee & drinks → contact. Shown as a swipeable carousel on mobile. */
const foldPages = [
  "/images/menu-fold-1.png",
  "/images/menu-fold-2.png",
  "/images/menu-fold-3.png",
  "/images/menu-fold-4.png",
  "/images/menu-fold-5.png",
  "/images/menu-fold-6.png",
];

/* Which full spread each fold panel belongs to. Default menuPageUrls order is
   [side 2 (inside menu), side 1 (outside)], so inside panels → 0, outside → 1.
   Tapping a panel opens that full page in the viewer. */
const foldToSpread = [1, 0, 0, 0, 1, 1];

function MenuBook({ pages }: { pages?: string[] }) {
  const menuPageUrls = pages && pages.length > 0 ? pages : defaultMenuPages;
  const [open, setOpen] = useState(false);
  const [startPage, setStartPage] = useState(0);
  const [viewerPages, setViewerPages] = useState<string[]>(menuPageUrls);
  const [viewerCurrent, setViewerCurrent] = useState(0);

  const openViewer = (pagesToView: string[], page: number) => {
    setViewerPages(pagesToView);
    setStartPage(page);
    setViewerCurrent(page);
    setOpen(true);
  };

  /* ── full-page viewer: swipe to page, pinch to zoom, tap outside to close ── */
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = viewerRef.current;
    const child = el?.children[startPage] as HTMLElement | undefined;
    if (el && child) el.scrollLeft = child.offsetLeft;
  }, [open, startPage]);

  const onViewerScroll = () => {
    const el = viewerRef.current;
    if (!el) return;
    setViewerCurrent(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goToViewer = (i: number) => {
    const el = viewerRef.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (el && child) el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  };

  /* ── mobile carousel position tracking ── */
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement;
      const childCenter = c.offsetLeft + c.offsetWidth / 2;
      const d = Math.abs(childCenter - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setCurrent(best);
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <>
      {/* ── Desktop: stacked spreads on a slight angle (click to open viewer) ── */}
      <div className="relative max-w-4xl mx-auto hidden sm:block">
        {menuPageUrls[1] && (
          <div
            onClick={() => openViewer(menuPageUrls, 1)}
            className="absolute inset-0 rounded-md border-[6px] border-[#ffffdc] shadow-2xl cursor-pointer hover:brightness-105 transition overflow-hidden"
            style={{ transform: "rotate(-4deg)", zIndex: 0 }}
          >
            <Image src={menuPageUrls[1]} alt="Elio's menu page 2" width={1546} height={1092} sizes="(max-width: 1024px) 100vw, 896px" className="block w-full h-auto" />
          </div>
        )}
        <div
          onClick={() => openViewer(menuPageUrls, 0)}
          className="relative rounded-md border-[6px] border-[#ffffdc] shadow-2xl cursor-pointer hover:brightness-105 transition overflow-hidden"
          style={{ transform: "rotate(2.5deg)", zIndex: 1 }}
        >
          <Image src={menuPageUrls[0]} alt="Elio's menu page 1" width={1546} height={1092} sizes="(max-width: 1024px) 100vw, 896px" className="block w-full h-auto" />
        </div>
      </div>

      {/* ── Mobile: swipeable tri-fold, one panel at a time ── */}
      <div className="sm:hidden">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6 pt-2 pb-12"
        >
          {foldPages.map((src, i) => (
            <div
              key={src}
              className={`snap-center shrink-0 w-[66%] ${i < foldPages.length - 1 ? "border-r-2 border-dashed border-[#13322b]/75" : ""}`}
            >
              <div
                onClick={() => {
                  // open the tapped side first, so the other side is one swipe-left away
                  const spread = foldToSpread[i];
                  const ordered =
                    menuPageUrls.length > 1
                      ? [menuPageUrls[spread], ...menuPageUrls.filter((_, idx) => idx !== spread)]
                      : menuPageUrls;
                  openViewer(ordered, 0);
                }}
                className="overflow-hidden cursor-pointer active:brightness-105"
                style={{ boxShadow: "0 2px 12.8px 0 rgba(0,0,0,0.06), 0 1px 6px 1.5px rgba(0,0,0,0.08)" }}
              >
                <Image src={src} alt={`Elio's menu panel ${i + 1}`} width={933} height={1974} sizes="66vw" className={`block w-full h-auto ${i === 0 || i === foldPages.length - 1 ? "brightness-110" : ""}`} />
              </div>
            </div>
          ))}
        </div>

        {/* dots */}
        <div className="flex justify-center gap-2 mt-2">
          {foldPages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to menu panel ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                current === i
                  ? "w-6 bg-[#FFFFDC] shadow-[0px_2px_6px_2px_rgba(0,0,0,0.15)]"
                  : "w-2.5 bg-[#102a23] shadow-[inset_0_2px_3px_rgba(0,0,0,0.15),inset_0_2px_9px_3px_rgba(0,0,0,0.15)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Full-page viewer — swipe to page, pinch to zoom, tap outside to close */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[99999] bg-black/20 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            ref={viewerRef}
            onScroll={onViewerScroll}
            className="h-full w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ touchAction: "pan-x pinch-zoom" }}
          >
            {viewerPages.map((src, i) => (
              <div
                key={src}
                className="snap-center shrink-0 w-full h-full flex items-center justify-center p-4"
                onClick={() => setOpen(false)}
              >
                <Image
                  src={src}
                  alt={`Elio's menu page ${i + 1}`}
                  width={1546}
                  height={1092}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-md"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>

          {/* on-brand page dots */}
          {viewerPages.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {viewerPages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToViewer(i);
                  }}
                  aria-label={`Go to menu page ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${viewerCurrent === i ? "w-6 bg-[#ffffdc]" : "w-2 bg-[#ffffdc]/40"}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}

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

/* ── Sticker positions ── */
const stickerLayout: {
  src: string; w: number; rot: number; top: string; left?: string; right?: string; delay: number; pop: "left" | "right" | "scale"; outlined?: boolean; hideOnMobile?: boolean; flip?: boolean; topClass?: string;
}[] = [
  { src: "sticker-3", w: 438, rot: 0, top: "calc(35% + 110px)", right: "calc(-2% - 10px)", delay: 0.15, pop: "right" },
  { src: "sticker-4", w: 311, rot: 0, top: "5%", right: "calc(2% + 200px)", delay: 0.12, pop: "right", hideOnMobile: true },
  { src: "sticker-cannoli", w: 294, rot: 0, top: "calc(8% - 100px)", left: "35%", delay: 0.3, pop: "scale", topClass: "top-[calc(8%-60px)] sm:top-[calc(8%-100px)]" },
  { src: "sticker-iced-coffee", w: 343, rot: 0, top: "calc(4% + 500px)", right: "calc(0% + 140px)", delay: 0.22, pop: "right" },
  { src: "sticker-12", w: 240, rot: -18, top: "35%", left: "-2%", delay: 0.2, pop: "left" },
  { src: "sticker-6", w: 408, rot: 0, top: "calc(11% + 20px)", right: "0%", delay: 0.25, pop: "right" },
  { src: "sticker-10", w: 380, rot: 0, top: "56%", left: "calc(25% + 10px)", delay: 0.35, pop: "scale" },
  { src: "sticker-16", w: 311, rot: 0, top: "calc(9% + 85px)", left: "16%", delay: 0.32, pop: "left" },
  { src: "sticker-13", w: 279, rot: 0, top: "calc(65% + 40px)", right: "calc(8% - 20px)", delay: 0.3, pop: "right" },
  { src: "sticker-7", w: 276, rot: -18, top: "80%", left: "0%", delay: 0.55, pop: "left" },
  { src: "sticker-moka", w: 221, rot: 8, top: "40%", right: "3%", delay: 0.18, pop: "right" },
  { src: "sticker-cup", w: 238, rot: 5, top: "calc(80% - 90px)", left: "50px", delay: 0.48, pop: "left" },
  { src: "sticker-cocoa", w: 312, rot: -3, top: "calc(70% - 115px)", left: "0%", delay: 0.42, pop: "left", flip: true },
  { src: "sticker-logo-badge", w: 160, rot: 12, top: "8%", right: "15%", delay: 0.2, pop: "right" },
  { src: "sticker-5", w: 280, rot: -8, top: "calc(15% + 650px)", right: "5%", delay: 0.25, pop: "right", topClass: "top-[calc(15%+610px)] sm:top-[calc(15%+650px)]" },
  { src: "sticker-takeaway-cup", w: 200, rot: -6, top: "calc(5% + 50px)", left: "calc(18% - 40px)", delay: 0.35, pop: "left" },
];

/* ── Mobile hero sticker spine (under sm only) — vertical cascade down the right edge ── */
const mobileSpine: { src: string; w: number; rot: number; right: number; dy?: number; outlined?: boolean }[] = [
  { src: "sticker-cannoli", w: 180, rot: 8, right: 78, dy: 10 },
  { src: "sticker-16", w: 170, rot: -5, right: -6, dy: -40 },
  { src: "sticker-6", w: 163, rot: 7, right: -16, dy: -40 },
  { src: "sticker-moka", w: 106, rot: -6, right: 60, dy: -40 },
  { src: "sticker-takeaway-cup", w: 114, rot: 6, right: 186, dy: -40 },
  { src: "sticker-5", w: 126, rot: -5, right: -4, dy: -120 },
];

/* ── About video polaroid (Elio video) ── */
function AboutVideoPolaroid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="absolute left-[40%] top-[50%] w-[32%] rotate-3 drop-shadow-2xl"
    >
      <div className="relative">
        <Image src="/images/polaroid-elio.png" alt="Pete's son Elio" width={795} height={946} className="block w-full h-auto" />
        {/* Video sits on top of the polaroid's photo window */}
        <div className="absolute overflow-hidden" style={{ top: "6.98%", left: "8.8%", right: "7.04%", bottom: "20.93%" }}>
          <video
            poster="/images/elio-poster.jpg"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source src="/images/elio-video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Catering enquiry form (mailto submit) ── */
const CATERING_FUTURA = "Futura, 'Trebuchet MS', sans-serif";
const cateringFieldClass =
  "w-full rounded-md bg-[#102a23] px-4 text-[#41635C] text-[12px] outline-none placeholder:uppercase placeholder:tracking-[0.06em] placeholder:text-[#41635C] shadow-[inset_0_2px_3px_rgba(0,0,0,0.15),inset_0_2px_9px_3px_rgba(0,0,0,0.15)] focus:ring-1 focus:ring-[#FFFFDC]/30 transition";

function CateringEnquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Catering enquiry${name ? ` — ${name}` : ""}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Event date: ${eventDate}`,
      "",
      message,
    ].join("\n");
    window.location.href = `mailto:info@elioscoburg.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12 max-w-xl"
    >
      <h3
        className="mb-6 text-[12px] uppercase tracking-[0.04em] font-light"
        style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255, 255, 220, 0.8)" }}
      >
        Catering enquiry
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={`${cateringFieldClass} h-[45px]`}
          style={{ fontFamily: CATERING_FUTURA }}
        />
        <input
          type="text"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.type = "date";
          }}
          onBlur={(e) => {
            if (!e.currentTarget.value) e.currentTarget.type = "text";
          }}
          placeholder="Event date"
          className={`${cateringFieldClass} h-[45px]`}
          style={{ fontFamily: CATERING_FUTURA, colorScheme: "dark" }}
        />
      </div>

      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className={`${cateringFieldClass} h-[45px] mt-3 sm:mt-4`}
        style={{ fontFamily: CATERING_FUTURA }}
      />

      <div className="relative mt-3 sm:mt-4">
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setMessageOpen(true)}
          onBlur={() => setMessageOpen(message.trim().length > 0)}
          placeholder="Message"
          className={`${cateringFieldClass} block py-3 pr-[120px] resize-none overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
          style={{ fontFamily: CATERING_FUTURA, height: messageOpen ? 150 : 45 }}
        />
        <button
          type="submit"
          className="absolute bottom-1.5 right-1.5 flex items-center h-[33px] px-6 bg-[#13322c] text-[#FFFFDC] text-[12px] uppercase tracking-[0.08em] rounded shadow-[0px_2px_6px_2px_rgba(0,0,0,0.15)] hover:bg-[#1a4034] transition-colors"
          style={{ fontFamily: CATERING_FUTURA }}
        >
          Submit
        </button>
      </div>
    </motion.form>
  );
}

/* ── Instagram Reels (Sanity-curated, official embeds) ── */
function ReelsSection({ heading, reels }: { heading?: string; reels?: { url: string }[] }) {
  const items = Array.isArray(reels) ? reels.filter((r) => r?.url) : [];

  useEffect(() => {
    if (items.length === 0) return;
    const w = window as unknown as { instgrm?: { Embeds: { process: () => void } } };
    const process = () => w.instgrm?.Embeds?.process();
    if (w.instgrm) {
      process();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src*="instagram.com/embed.js"]');
    if (existing) {
      existing.addEventListener("load", process);
      return () => existing.removeEventListener("load", process);
    }
    const s = document.createElement("script");
    s.src = "https://www.instagram.com/embed.js";
    s.async = true;
    s.onload = process;
    document.body.appendChild(s);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section
      id="reels"
      className="relative text-white px-6 sm:px-10 py-20 sm:py-32"
      style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-[12px] uppercase tracking-[0.04em] mb-8 font-light text-center"
          style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255, 255, 220, 0.8)" }}
        >
          {heading || "Follow along"}
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {items.map((r, i) => (
            <blockquote
              key={`${r.url}-${i}`}
              className="instagram-media"
              data-instgrm-permalink={r.url}
              data-instgrm-version="14"
              style={{ background: "#FFF", border: 0, borderRadius: 3, margin: 0, maxWidth: 340, minWidth: 260, width: "100%" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Main Hero ── */
type HeroProps = {
  cafeInfo: any;
  menu: any[];
  menuPages: any[];
  announcement: any;
  navigation: any;
  aboutSection: any;
  instagramReels?: any;
};

export default function Hero({ cafeInfo, menu, menuPages, announcement, navigation, aboutSection, instagramReels }: HeroProps) {
  const constraintRef = useRef<HTMLDivElement>(null);
  const zCounter = useRef(1000);
  const getNextZ = () => ++zCounter.current;

  // ── Contact details ──
  const addr = cafeInfo?.address || "70 Newlands Road";
  const phone = cafeInfo?.phone || "(03) 9191 0107";
  const email = cafeInfo?.email || "info@elioscoburg.com";
  const igHandle = (cafeInfo?.instagram || "elios.coburg")
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${addr}, Coburg North VIC 3058`,
  )}`;
  const hoursRows: { days: string; time: string }[] =
    cafeInfo?.hours && cafeInfo.hours.length > 0
      ? cafeInfo.hours.map((h: any) => ({ days: h.days, time: h.time }))
      : [
          { days: "Mon – Fri", time: "7am – 2:30pm" },
          { days: "Saturday", time: "8am – 2:30pm" },
          { days: "Sunday", time: "9am – 2:30pm" },
        ];

  return (
    <div ref={constraintRef} className="relative overflow-x-hidden">
    <section
      className="relative text-white"
      style={{ minHeight: "100vh", backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}
    >

      {/* Navigation */}
      <Nav items={navigation?.items} />

      {/* Stickers */}
      {stickerLayout.map((s, i) => (
        <Draggable
          key={`${s.src}-${i}`}
          rotation={s.rot}
          delay={s.delay * 0.55}
          initialZ={1000 + i}
          constraintRef={constraintRef}
          getNextZ={getNextZ}
          popFrom={s.pop}
          className={`hidden sm:block ${s.topClass ?? ""}`}
          style={{ top: s.topClass ? undefined : s.top, left: s.left, right: s.right, width: `clamp(${Math.round(s.w * 0.35 * 1.05)}px, ${(s.w / 13) * 1.05}vw, ${s.w}px)` }}
        >
          <Image src={`/images/${s.src}.png`} alt="" width={s.w} height={s.w} sizes={`${s.w}px`} className={`w-full h-auto ${s.outlined ? "sticker-outlined" : "sticker-shadow"} ${s.flip ? "scale-x-[-1]" : ""}`} draggable={false} />
        </Draggable>
      ))}


      {/* Central logo (desktop) */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...pop, delay: 0.25 }}
        className="hidden sm:block absolute z-[9999] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ top: "45%", width: "clamp(190px, 22.8vw, 342px)" }}
      >
        <Image src="/images/elios-hero-logo-new.png" alt="Elio's Panino Italiano" width={1000} height={520} className="w-full h-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" priority />
      </motion.div>

      {/* Mobile hero — asymmetric: left text column + right sticker spine */}
      <div className="sm:hidden absolute inset-0 flex">
        {/* Left text column */}
        <div className="w-[64%] shrink-0 flex flex-col justify-center items-start pl-7 pr-2">
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
            style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "22.7px", lineHeight: 0.94, letterSpacing: "-0.045em", color: "#FFFFDC", textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}
          >
            Walk in a customer.<br />
            <em className="italic">Leave a cousin.</em>
          </motion.h1>
        </div>

        {/* Right sticker spine */}
        <div className="flex-1 min-w-0 flex flex-col items-end justify-evenly py-2 pointer-events-none">
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
      </div>

    </section>

    {/* About section */}
    <section className="relative text-white px-6 sm:px-10 py-20 sm:py-32 " id="about" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      {/* Card sticker */}
      <motion.div
        initial={{ opacity: 0, rotate: 15 }}
        whileInView={{ opacity: 1, rotate: 8 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="hidden sm:block absolute left-[3%] top-[5%] pointer-events-none"
        style={{ width: "clamp(80px, 10vw, 140px)" }}
      >
        <Image src="/images/sticker-card.png" alt="" width={140} height={200} sizes="140px" className="w-full h-auto sticker-shadow" />
      </motion.div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-12">
        {/* About graphic — three-generation polaroid composition */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-full md:w-[52%]"
        >
          <div className="relative w-full aspect-[13/14] text-[#FFFFDC] scale-[1.15]" style={{ fontFamily: "var(--font-caveat)" }}>
            {/* Polaroid 1 — Pete's dad (B&W) */}
            <Image src="/images/polaroid-founders.png" alt="Pete's dad" width={1521} height={1518} sizes="(max-width: 768px) 42vw, 24vw" className="absolute left-[6%] top-[8%] w-[40%] h-auto drop-shadow-xl -rotate-3" />
            {/* Polaroid 2 — the family */}
            <Image src="/images/polaroid-family.png" alt="Pete's son Elio" width={400} height={470} sizes="(max-width: 768px) 40vw, 22vw" className="absolute left-[22%] top-[31%] w-[39%] h-auto drop-shadow-xl -rotate-2" />
            {/* Polaroid 3 — the reason it all works (Elio video) */}
            <AboutVideoPolaroid />

            {/* Dashed arrows */}
            <img src="/images/arrow-dad.svg" alt="" aria-hidden="true" className="absolute left-[calc(36%-50px)] top-[calc(6%-20px)] w-[48%] pointer-events-none" />
            <img src="/images/arrow-elio.svg" alt="" aria-hidden="true" className="absolute left-[60%] top-[calc(37%-20px)] w-[27%] pointer-events-none" />
            <img src="/images/arrow-pete.svg" alt="" aria-hidden="true" className="absolute left-[1%] top-[52%] w-[47%] pointer-events-none" />
          </div>
        </motion.div>

        {/* About Us text */}
        <div className="flex-1">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl md:text-[26px] leading-[0.95] text-[#FFFFDC] w-[85vw] sm:w-auto"
            style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}
          >
            {aboutSection?.body ? (
              <PortableText value={aboutSection.body} />
            ) : (
              <>Elio&apos;s started with a simple idea: bring the kind of food you&apos;d actually eat in Italy, proper paninis, real focaccia, coffee that takes itself seriously without taking itself too seriously, to the corner of Newlands Road in <em className="italic">Coburg North.</em></>
            )}
          </motion.p>
        </div>
      </div>
    </section>

    {/* Menu section */}
    <section className="relative text-white px-6 sm:px-10 pt-10 pb-20 sm:pb-32 " id="menu" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      {/* Tinned tomatoes — behind panini sticker */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="hidden sm:block absolute pointer-events-none z-[1]"
        style={{ right: "calc(5% - 60px)", top: "calc(15% + 355px)", width: "clamp(96px, 11vw, 160px)" }}
      >
        <Image src="/images/sticker-tomato-can.png" alt="" width={162} height={162} sizes="162px" className="w-full h-auto sticker-shadow -rotate-5" />
      </motion.div>


      {/* Piadina sticker */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="hidden sm:block absolute left-[3%] bottom-[5%] pointer-events-none z-[100]"
        style={{ width: "clamp(192px, 22vw, 336px)" }}
      >
        <Image src="/images/sticker-piadina-v2.png" alt="" width={336} height={336} sizes="336px" className="w-full h-auto sticker-shadow" />
      </motion.div>

      {/* Panini + iced coffee sticker */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="hidden sm:block absolute right-[3%] pointer-events-none z-[100]"
        style={{ top: "calc(3% - 100px)", width: "clamp(214px, 25vw, 367px)" }}
      >
        <Image src="/images/sticker-7.png" alt="" width={497} height={497} sizes="497px" className="w-full h-auto sticker-shadow" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-7xl mx-auto"
      >
        <MenuBook pages={menuPages && menuPages.length > 0 ? menuPages.map((p: any) => urlFor(p.image).width(1546).height(1092).url()) : undefined} />
      </motion.div>
    </section>

    {/* Instagram reels */}
    <ReelsSection heading={instagramReels?.heading} reels={instagramReels?.reels} />

    {/* Catering section */}
    <section className="relative text-white px-6 sm:px-10 pt-20 sm:pt-32 pb-4 sm:pb-6 " id="catering" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-12">
        {/* Left side — stickers and images */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-full md:w-[50%] relative min-h-[300px] sm:min-h-[420px] md:min-h-[660px]"
        >
          {/* Polaroid */}
          <motion.div
            initial={{ opacity: 0, rotate: 10 }}
            whileInView={{ opacity: 1, rotate: -6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="absolute right-[3%] top-[2%]"
            style={{ width: "clamp(144px, 16vw, 240px)" }}
          >
            <Image src="/images/catering-family-polaroid.png" alt="Elio's family" width={885} height={1020} sizes="408px" className="w-full h-auto drop-shadow-xl" />
          </motion.div>

          {/* Catering polaroid */}
          <motion.div
            initial={{ opacity: 0, rotate: 15 }}
            whileInView={{ opacity: 1, rotate: 6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="absolute right-[18%] top-[12%]"
            style={{ width: "clamp(143px, 17vw, 242px)" }}
          >
            <Image src="/images/catering-polaroid.png" alt="Catering" width={408} height={491} sizes="408px" className="w-full h-auto drop-shadow-xl" />
          </motion.div>

          {/* Holding panini — bleeds off the left page edge */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="absolute left-[-14%] top-[2%]"
            style={{ width: "clamp(240px, 30vw, 450px)" }}
          >
            <Image src="/images/sticker-holding-panini-v2.png" alt="" width={300} height={300} sizes="300px" className="w-full h-auto sticker-shadow" />
          </motion.div>

          {/* Tomato sticker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.35 }}
            className="absolute right-[calc(6%+170px)] top-[calc(4%+120px)]"
            style={{ width: "clamp(144px, 17vw, 240px)" }}
          >
            <Image src="/images/sticker-tomato-single.png" alt="" width={304} height={304} sizes="304px" className="w-full h-auto sticker-shadow" />
          </motion.div>

        </motion.div>

        {/* Right side — text */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {cafeInfo?.cateringText ? (
              <div className="text-lg sm:text-xl md:text-[26px] leading-[0.95] text-[#FFFFDC] w-[85vw] sm:w-auto" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>
                <PortableText value={cafeInfo.cateringText} />
              </div>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-[26px] leading-[0.95] text-[#FFFFDC] mb-8 w-[85vw] sm:w-auto" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>
                  From office lunches to private events, we bring Elio&apos;s to you. Our catering menu features our signature paninis, fresh focaccia, platters, and of course, proper Italian coffee.
                </p>
                <p className="text-lg sm:text-xl md:text-[26px] leading-[0.95] text-[#FFFFDC] mb-12 w-[85vw] sm:w-auto" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>
                  Get in touch to discuss your next event.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-12" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  <div>
                    <p className="text-lg sm:text-xl md:text-[26px] leading-[0.95] text-[#FFFFDC]">(03) 9191 0107</p>
                    <a href="mailto:info@elioscoburg.com" className="block text-lg sm:text-xl md:text-[26px] leading-[0.95] text-[#FFFFDC] hover:text-white transition-colors">info@elioscoburg.com</a>
                  </div>
                  <div>
                    <a href="https://instagram.com/elios.coburg" target="_blank" rel="noopener noreferrer" className="text-lg sm:text-xl md:text-[26px] leading-[0.95] text-[#FFFFDC] underline underline-offset-4 hover:text-white transition-colors" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>@elios.coburg</a>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          <CateringEnquiryForm />

          {/* Cup + panini-receipts below the enquiry form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="mt-[18px]"
          >
            {/* Mobile: cup nestled in the panini-with-receipts bottom-right corner (panini 8% smaller) */}
            <div className="relative inline-block sm:hidden">
              <Image src="/images/panini-receipts.png" alt="" width={1260} height={1620} sizes="260px" className="block h-auto sticker-shadow" style={{ width: "clamp(258px, 37vw, 313px)" }} />
              <Image src="/images/sticker-cup.png" alt="" width={180} height={180} sizes="110px" className="absolute bottom-0 right-0 h-auto sticker-shadow" style={{ width: "clamp(96px, 28vw, 120px)" }} />
            </div>
            {/* Desktop: cup + panini side by side */}
            <div className="hidden sm:flex flex-wrap items-end gap-6">
              <Image src="/images/sticker-cup.png" alt="" width={180} height={180} sizes="170px" className="h-auto sticker-shadow" style={{ width: "clamp(110px, 16vw, 170px)" }} />
              <Image src="/images/panini-receipts.png" alt="" width={1260} height={1620} sizes="340px" className="h-auto sticker-shadow" style={{ width: "clamp(280px, 40vw, 340px)" }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Contact section */}
    <section id="contact" className="relative text-white px-6 sm:px-10 pt-4 sm:pt-6 pb-20 sm:pb-32" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      {/* Loyalty card */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="absolute pointer-events-none"
        style={{ left: "calc(5% + 130px)", top: "calc(10% + 60px)", width: "clamp(152px, 17vw, 247px)" }}
      >
        <Image src="/images/sticker-loyalty-card.png" alt="" width={260} height={260} sizes="260px" className="w-full h-auto sticker-shadow -rotate-6" />
      </motion.div>


      <div className="max-w-6xl mx-auto">
        {/* Map (now above the contact text) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="h-[350px] sm:h-[420px] rounded-lg overflow-hidden map-container mb-14 sm:mb-16"
        >
          <Map />
        </motion.div>

        {/* Contact details — VISIT / CONTACT / HOURS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-16"
        >
          {/* VISIT */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-4"
              style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255,255,220,0.55)" }}
            >
              Visit
            </p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get directions"
              className="group block text-[#FFFFDC] hover:text-[#eeece6] transition-colors"
              style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.01em" }}
            >
              <p className="text-lg sm:text-lg md:text-xl leading-[1.2]">{addr}</p>
              <p className="text-lg sm:text-lg md:text-xl leading-[1.2]">Coburg North, 3058</p>
              <p className="text-lg sm:text-lg md:text-xl leading-[1.2]">
                Melbourne{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </p>
            </a>
          </div>

          {/* CONTACT */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-4"
              style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255,255,220,0.55)" }}
            >
              Contact
            </p>
            <div style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.01em" }}>
              <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="block text-lg sm:text-lg md:text-xl leading-[1.2] text-[#FFFFDC] hover:text-[#eeece6] transition-colors">{phone}</a>
              <a href={`mailto:${email}`} className="block text-lg sm:text-lg md:text-xl leading-[1.2] text-[#FFFFDC] hover:text-[#eeece6] transition-colors break-all">{email}</a>
              <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer" className="block text-lg sm:text-lg md:text-xl leading-[1.2] text-[#FFFFDC] hover:text-[#eeece6] transition-colors">@{igHandle}</a>
            </div>
          </div>

          {/* HOURS */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-4"
              style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255,255,220,0.55)" }}
            >
              Hours
            </p>
            <div style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.01em" }}>
              {hoursRows.map((h, i) => (
                <div key={i} className="flex items-baseline leading-[1.2] text-lg sm:text-lg md:text-xl text-[#FFFFDC]">
                  <span className="whitespace-nowrap">{h.days}</span>
                  <span aria-hidden="true" className="flex-1 overflow-hidden mx-2 text-[#FFFFDC]/40 tracking-[0.25em] whitespace-nowrap">............................................................</span>
                  <span className="whitespace-nowrap">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Logo — centered below the contact details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mt-12 sm:mt-16"
        >
          <Image src="/images/logo-circle.png" alt="Elio's" width={371} height={371} sizes="96px" className="w-[77px] sm:w-[96px] h-auto" />
        </motion.div>
      </div>
    </section>
    </div>
  );
}
