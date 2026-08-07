"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import SectionShell from "./section-shell";
import PageTitle from "./page-title";

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

/* Top padding matches the About and Catering sections. The original pt-10 was
   set when this sat mid-page after About; as the top of its own page it needs
   to clear the fixed nav (~38px mobile, ~53px desktop). */
export default function MenuSection({ menu, menuPages }: { menu: any[]; menuPages: string[] }) {
  return (
    <SectionShell id="menu" className="px-6 sm:px-10 pt-20 sm:pt-32 pb-20 sm:pb-32">
      <PageTitle>Our Menu</PageTitle>
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
        style={{ top: "calc(3% - 30px)", width: "clamp(214px, 25vw, 367px)" }}
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
    </SectionShell>
  );
}
