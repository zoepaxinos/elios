"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Nav from "./components/nav";
import Footer from "./components/footer";
import Map from "./components/map";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/sanity/image";

/* ── Menu Book (side by side + lightbox with page nav) ── */
const defaultMenuPages = ["/images/menu-2.png", "/images/menu-1.png"];

function MenuBook({ pages }: { pages?: string[] }) {
  const menuPageUrls = pages && pages.length > 0 ? pages : defaultMenuPages;
  const [open, setOpen] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [scale, setScale] = useState(1);

  const openViewer = (page: number) => {
    setActivePage(page);
    setScale(1);
    setOpen(true);
  };

  return (
    <>
      {/* Single page display with nav dots */}
      <div
        className="relative max-w-5xl mx-auto rounded-md border-[6px] border-[#ffffdc] shadow-2xl cursor-pointer hover:brightness-105 transition overflow-hidden"
        onClick={() => openViewer(activePage)}
      >
        <Image
          src={menuPageUrls[activePage]}
          alt={`Elio's menu page ${activePage + 1}`}
          width={1546}
          height={1092}
          className="w-full h-auto"
        />
      </div>
      {/* Page dots + arrows */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => { setActivePage((p) => Math.max(p - 1, 0)); }}
          disabled={activePage === 0}
          className="text-[#ffffdc]/60 hover:text-[#ffffdc] transition disabled:opacity-20 text-2xl"
        >
          ‹
        </button>
        {menuPageUrls.map((_, i) => (
          <button
            key={i}
            onClick={() => setActivePage(i)}
            className={`w-2 h-2 rounded-full transition ${i === activePage ? "bg-[#ffffdc]" : "bg-[#ffffdc]/30"}`}
          />
        ))}
        <button
          onClick={() => { setActivePage((p) => Math.min(p + 1, menuPageUrls.length - 1)); }}
          disabled={activePage === menuPageUrls.length - 1}
          className="text-[#ffffdc]/60 hover:text-[#ffffdc] transition disabled:opacity-20 text-2xl"
        >
          ›
        </button>
      </div>

      {/* Lightbox viewer */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative max-w-[90vw] max-h-[90vh] overflow-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Controls */}
            <div className="sticky top-3 z-10 flex justify-between items-center px-4">
              {/* Page nav */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActivePage((p) => Math.max(p - 1, 0))}
                  disabled={activePage === 0}
                  className="bg-white/90 text-black w-9 h-9 rounded-full text-lg font-bold shadow-md hover:bg-white transition disabled:opacity-30"
                >
                  ‹
                </button>
                <span className="bg-white/90 text-black px-3 h-9 rounded-full text-sm font-medium shadow-md flex items-center">
                  {activePage + 1} / {menuPageUrls.length}
                </span>
                <button
                  onClick={() => setActivePage((p) => Math.min(p + 1, menuPageUrls.length - 1))}
                  disabled={activePage === menuPageUrls.length - 1}
                  className="bg-white/90 text-black w-9 h-9 rounded-full text-lg font-bold shadow-md hover:bg-white transition disabled:opacity-30"
                >
                  ›
                </button>
              </div>
              {/* Zoom + close */}
              <div className="flex gap-2">
                <button onClick={() => setScale((s) => Math.min(s + 0.25, 3))} className="bg-white/90 text-black w-9 h-9 rounded-full text-lg font-bold shadow-md hover:bg-white transition">+</button>
                <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))} className="bg-white/90 text-black w-9 h-9 rounded-full text-lg font-bold shadow-md hover:bg-white transition">−</button>
                <button onClick={() => setOpen(false)} className="bg-white/90 text-black w-9 h-9 rounded-full text-lg font-bold shadow-md hover:bg-white transition">✕</button>
              </div>
            </div>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
              <Image
                src={menuPageUrls[activePage]}
                alt={`Elio's menu page ${activePage + 1}`}
                width={1546}
                height={1092}
                className="w-full h-auto rounded-md mt-3"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

/* ── Animation ── */
const pop = { type: "spring" as const, stiffness: 260, damping: 22 };

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
  const initial =
    popFrom === "left"
      ? { x: -80, rotate: rotation - 15, opacity: 0, scale: 0.7 }
      : popFrom === "right"
        ? { x: 80, rotate: rotation + 15, opacity: 0, scale: 0.7 }
        : { scale: 0, rotate: rotation - 20, opacity: 0 };

  return (
    <motion.div
      drag
      dragConstraints={constraintRef}
      dragElastic={0.15}
      dragMomentum={false}
      whileHover={{ rotate: rotation + 8, scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 15 } }}
      whileDrag={{ scale: 1.06, cursor: "grabbing" }}
      onDragStart={() => setZ(getNextZ())}
      initial={initial}
      animate={{ scale: 1, rotate: rotation, opacity: 1, x: 0 }}
      transition={{ ...pop, delay }}
      className={`absolute cursor-grab active:cursor-grabbing select-none ${className}`}
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
      <Image src={src} alt="Elio's" width={408} height={491} className="w-full h-auto drop-shadow-xl" draggable={false} />
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
        <Image src="/images/polaroid-frame-empty.png" alt="" width={408} height={491} className="w-full h-auto" draggable={false} />
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
  src: string; w: number; rot: number; top: string; left?: string; right?: string; delay: number; pop: "left" | "right" | "scale"; outlined?: boolean; hideOnMobile?: boolean;
}[] = [
  { src: "sticker-3", w: 461, rot: 0, top: "calc(5% + 40px)", left: "calc(18% - 90px)", delay: 0.15, pop: "left" },
  { src: "sticker-4", w: 346, rot: 0, top: "5%", right: "calc(2% + 200px)", delay: 0.12, pop: "right", hideOnMobile: true },
  { src: "sticker-cannoli", w: 294, rot: 0, top: "calc(25% - 120px)", left: "32%", delay: 0.3, pop: "scale", hideOnMobile: true },
  { src: "sticker-iced-coffee", w: 286, rot: 0, top: "calc(4% + 600px)", right: "calc(0% + 200px)", delay: 0.22, pop: "right", outlined: true },
  { src: "sticker-12", w: 299, rot: -18, top: "calc(9% + 50px)", left: "16%", delay: 0.2, pop: "left" },
  { src: "sticker-6", w: 340, rot: 0, top: "11%", right: "0%", delay: 0.25, pop: "right" },
  { src: "sticker-10", w: 346, rot: 0, top: "56%", left: "calc(28% + 130px)", delay: 0.35, pop: "scale", hideOnMobile: true },
  { src: "sticker-16", w: 346, rot: 0, top: "35%", left: "-2%", delay: 0.32, pop: "left" },
  { src: "sticker-13", w: 380, rot: 0, top: "35%", right: "-2%", delay: 0.3, pop: "right" },
  { src: "sticker-7", w: 276, rot: -18, top: "80%", left: "0%", delay: 0.55, pop: "left" },
  { src: "sticker-moka", w: 274, rot: 8, top: "calc(2% + 20px)", left: "calc(8% - 130px)", delay: 0.18, pop: "left" },
  { src: "sticker-cup", w: 180, rot: 5, top: "80%", left: "18%", delay: 0.48, pop: "left" },
  { src: "sticker-cocoa", w: 312, rot: -3, top: "calc(70% - 70px)", left: "15%", delay: 0.42, pop: "left" },
  { src: "sticker-logo-badge", w: 160, rot: 12, top: "8%", right: "15%", delay: 0.2, pop: "right" },
  { src: "sticker-tomato-can", w: 180, rot: -5, top: "calc(60% + 800px)", right: "10%", delay: 0.4, pop: "right" },
];

/* ── Main Hero ── */
type HeroProps = {
  cafeInfo: any;
  menu: any[];
  menuPages: any[];
  announcement: any;
  navigation: any;
  aboutSection: any;
};

export default function Hero({ cafeInfo, menu, menuPages, announcement, navigation, aboutSection }: HeroProps) {
  const constraintRef = useRef<HTMLDivElement>(null);
  const zCounter = useRef(1000);
  const getNextZ = () => ++zCounter.current;

  return (
    <div ref={constraintRef} className="relative">
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
          delay={s.delay}
          initialZ={1000 + i}
          constraintRef={constraintRef}
          getNextZ={getNextZ}
          popFrom={s.pop}
          className={s.hideOnMobile ? "hidden sm:block" : ""}
          style={{ top: s.top, left: s.left, right: s.right, width: `clamp(${Math.round(s.w * 0.35)}px, ${s.w / 13}vw, ${s.w}px)` }}
        >
          <Image src={`/images/${s.src}.png`} alt="" width={s.w} height={s.w} className={`w-full h-auto ${s.outlined ? "sticker-outlined" : "sticker-shadow"}`} draggable={false} />
        </Draggable>
      ))}


      {/* Central logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...pop, delay: 0.25 }}
        className="absolute z-[9999] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ top: "45%", width: "clamp(200px, 24vw, 360px)" }}
      >
        <Image src="/images/elios-hero-logo-new.png" alt="Elio's Panino Italiano" width={1000} height={520} className="w-full h-auto" priority />
      </motion.div>

    </section>

    {/* About section */}
    <section className="relative text-white px-6 sm:px-10 py-20 sm:py-32" id="about" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      {/* Card sticker */}
      <motion.div
        initial={{ opacity: 0, rotate: 15 }}
        whileInView={{ opacity: 1, rotate: 8 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute right-[5%] bottom-[8%] pointer-events-none"
        style={{ width: "clamp(80px, 10vw, 140px)" }}
      >
        <Image src="/images/sticker-card.png" alt="" width={140} height={200} className="w-full h-auto sticker-shadow" />
      </motion.div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-12">
        {/* About graphic — polaroids, arrows, handwritten text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-full md:w-[50%]"
        >
          <div className="relative">
            {aboutSection?.image ? (
              <Image src={urlFor(aboutSection.image).width(900).height(800).url()} alt={aboutSection?.heading || "About"} width={900} height={800} className="w-full h-auto" />
            ) : (
              <Image src="/images/aboutus-graphic.png" alt="Meet Elio and I'm Pete" width={900} height={800} className="w-full h-auto" />
            )}
            {/* Video polaroid overlay */}
            <motion.div
              initial={{ opacity: 0, rotate: 12 }}
              whileInView={{ opacity: 1, rotate: 5 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-[25%] left-[30%] w-[42%] sm:w-[38%] drop-shadow-2xl"
            >
              <div className="bg-[#fffef8] p-2 pb-10 sm:p-3 sm:pb-12 shadow-xl">
                <div className="aspect-square overflow-hidden">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/images/elio-video.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* About Us text */}
        <div className="flex-1">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[16px] uppercase tracking-[0.04em] mb-4 font-light"
            style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255, 255, 220, 0.8)" }}
          >
            {aboutSection?.heading || "About Us"}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-base sm:text-lg md:text-[24px] leading-[0.95] text-[#FFFFDC]"
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
    <section className="relative text-white px-6 sm:px-10 pt-10 pb-20 sm:pb-32" id="menu" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      {/* Pasta night poster */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="absolute left-[3%] top-[3%] pointer-events-none z-[100]"
        style={{ width: "clamp(144px, 17vw, 240px)" }}
      >
        <Image src="/images/sticker-poster.png" alt="" width={240} height={336} className="w-full h-auto sticker-shadow" />
      </motion.div>

      {/* Piadina sticker */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute left-[3%] bottom-[5%] pointer-events-none z-[100]"
        style={{ width: "clamp(192px, 22vw, 336px)" }}
      >
        <Image src="/images/sticker-piadina-v2.png" alt="" width={336} height={336} className="w-full h-auto sticker-shadow" />
      </motion.div>

      {/* Panini + iced coffee sticker */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute right-[3%] pointer-events-none z-[100]"
        style={{ top: "calc(3% - 100px)", width: "clamp(252px, 29vw, 432px)" }}
      >
        <Image src="/images/sticker-7.png" alt="" width={497} height={497} className="w-full h-auto sticker-shadow" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-[16px] uppercase tracking-[0.04em] mb-10 font-light text-center"
        style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255, 255, 220, 0.8)" }}
      >
        {cafeInfo?.menuHeading || "Our Menu"}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-7xl mx-auto"
      >
        <MenuBook pages={menuPages && menuPages.length > 0 ? menuPages.map((p: any) => urlFor(p.image).width(1546).height(1092).url()) : undefined} />
      </motion.div>
    </section>

    {/* Catering section */}
    <section className="relative text-white px-6 sm:px-10 py-20 sm:py-32" id="catering" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      {/* Polaroid */}
      <motion.div
        initial={{ opacity: 0, rotate: 10 }}
        whileInView={{ opacity: 1, rotate: -6 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute right-[5%] top-[8%] pointer-events-none"
        style={{ width: "clamp(144px, 16vw, 240px)" }}
      >
        <Image src="/images/Elios_Polaroids_1.png" alt="Elio's" width={408} height={491} className="w-full h-auto drop-shadow-xl" />
      </motion.div>

      {/* Tomato sticker */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute left-[3%] pointer-events-none"
        style={{ bottom: "calc(10% - 80px)", width: "clamp(169px, 21vw, 304px)" }}
      >
        <Image src="/images/sticker-tomato-single.png" alt="" width={304} height={304} className="w-full h-auto sticker-shadow" />
      </motion.div>

      {/* Cup sticker */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute right-[5%] top-[10%] pointer-events-none"
        style={{ width: "clamp(140px, 16vw, 240px)" }}
      >
        <Image src="/images/sticker-cup.png" alt="" width={180} height={180} className="w-full h-auto sticker-shadow" />
      </motion.div>


      <div className="max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-[16px] uppercase tracking-[0.04em] mb-8 font-light"
          style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255, 255, 220, 0.8)" }}
        >
          {cafeInfo?.cateringHeading || "Catering"}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {cafeInfo?.cateringText ? (
            <div className="text-base sm:text-lg md:text-[24px] leading-[0.95] text-[#FFFFDC]" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>
              <PortableText value={cafeInfo.cateringText} />
            </div>
          ) : (
            <>
              <p className="text-base sm:text-lg md:text-[24px] leading-[0.95] text-[#FFFFDC] mb-8" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>
                From office lunches to private events, we bring Elio&apos;s to you. Our catering menu features our signature paninis, fresh focaccia, platters, and of course, proper Italian coffee.
              </p>
              <p className="text-base sm:text-lg md:text-[24px] leading-[0.95] text-[#FFFFDC] mb-12" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>
                Get in touch to discuss your next event.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                <div>
                  <p className="text-[#FFFFDC] text-lg leading-relaxed">(03) 9191 0107</p>
                  <p className="text-[#FFFFDC] text-lg leading-relaxed">info@elioscoburg.com</p>
                </div>
                <div>
                  <a href="https://instagram.com/elios.coburg" target="_blank" rel="noopener noreferrer" className="text-[#FFFFDC] text-lg leading-relaxed underline underline-offset-4 hover:text-white transition-colors">@elios.coburg</a>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>

    {/* Contact section */}
    <section className="relative text-white px-6 sm:px-10 py-20 sm:py-32" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      {/* Contact receipts sticker */}
      <motion.div
        initial={{ opacity: 0, rotate: 10 }}
        whileInView={{ opacity: 1, rotate: 3 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute right-[5%] pointer-events-none"
        style={{ top: "calc(8% - 200px)", width: "clamp(240px, 30vw, 450px)" }}
      >
        <Image src="/images/sticker-contactus-receipts.png" alt="" width={450} height={450} className="w-full h-auto sticker-shadow" />
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-[16px] uppercase tracking-[0.04em] mb-10 font-light"
          style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255, 255, 220, 0.8)" }}
        >
          {cafeInfo?.contactHeading || "Contact"}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-16"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          <div>
            <p className="text-[#FFFFDC] text-lg leading-relaxed">{cafeInfo?.address || "70 Newlands Road"}</p>
            <p className="text-[#FFFFDC] text-lg leading-relaxed">Coburg North, 3058</p>
            <p className="text-[#FFFFDC] text-lg leading-relaxed">Melbourne</p>
          </div>
          <div>
            <p className="text-[#FFFFDC] text-lg leading-relaxed">{cafeInfo?.instagram || "elios.coburg"}</p>
            <p className="text-[#FFFFDC] text-lg leading-relaxed">{cafeInfo?.phone || "(03) 9191 0107"}</p>
            <p className="text-[#FFFFDC] text-lg leading-relaxed">{cafeInfo?.email || "info@elioscoburg.com"}</p>
          </div>
          <div>
            {cafeInfo?.hours && cafeInfo.hours.length > 0 ? (
              cafeInfo.hours.map((h: any, i: number) => (
                <p key={i} className="text-[#FFFFDC] text-lg leading-relaxed">{h.days} {h.time}</p>
              ))
            ) : (
              <>
                <p className="text-[#FFFFDC] text-lg leading-relaxed">Monday – Friday 7am – 2:30pm</p>
                <p className="text-[#FFFFDC] text-lg leading-relaxed">Saturday 8am – 2:30pm</p>
                <p className="text-[#FFFFDC] text-lg leading-relaxed">Sunday 9am – 2:30pm</p>
              </>
            )}
          </div>
        </motion.div>
        <div className="flex items-center gap-5 mt-8">
          <a href="https://instagram.com/elios.coburg" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,0.5)" stroke="none" />
            </svg>
          </a>
          <a href="mailto:info@elioscoburg.com" aria-label="Email">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </a>
        </div>
        {/* Map */}
        <div className="mt-12 h-[350px] sm:h-[400px] rounded-lg overflow-hidden map-container">
          <Map />
        </div>
      </div>
    </section>

    <Footer />
    </div>
  );
}
