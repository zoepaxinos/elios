"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

/* ── Instagram Reels (Sanity-curated, official embeds) ── */
export default function ReelsSection({ heading, reels }: { heading?: string; reels?: { url: string }[] }) {
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
