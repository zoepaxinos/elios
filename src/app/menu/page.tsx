"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import PageLayout from "../components/page-layout";

function MenuImage({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);

  return (
    <>
      <Image
        src={src}
        alt="Elio's menu"
        width={1546}
        height={1092}
        className="w-full h-auto rounded-md border-[6px] border-[#ffffdc] shadow-xl cursor-pointer hover:brightness-105 transition"
        onClick={() => { setOpen(true); setScale(1); }}
      />
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative max-w-[90vw] max-h-[90vh] overflow-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-2 right-2 float-right z-10 flex gap-2 mr-2 mt-2">
              <button onClick={() => setScale((s) => Math.min(s + 0.25, 3))} className="bg-white/90 text-black w-8 h-8 rounded-full text-lg font-bold shadow-md hover:bg-white transition">+</button>
              <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))} className="bg-white/90 text-black w-8 h-8 rounded-full text-lg font-bold shadow-md hover:bg-white transition">−</button>
              <button onClick={() => setOpen(false)} className="bg-white/90 text-black w-8 h-8 rounded-full text-lg font-bold shadow-md hover:bg-white transition">✕</button>
            </div>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
              <Image src={src} alt="Elio's menu" width={1546} height={1092} className="w-full h-auto rounded-md" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

export default function MenuPage() {
  return (
    <PageLayout>
      <section className="relative px-6 sm:px-10 pt-10 pb-20 sm:pb-32">
        {/* Panini + iced coffee sticker */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="absolute right-[3%] top-[3%] pointer-events-none"
          style={{ width: "clamp(140px, 16vw, 240px)" }}
        >
          <Image src="/images/sticker-7.png" alt="" width={276} height={276} className="w-full h-auto drop-shadow-lg" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-[20px] uppercase tracking-[0.04em] text-white/50 mb-10 font-light"
          style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif" }}
        >
          Our Menu
        </motion.p>
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <MenuImage src="/images/menu-1.png" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14, rotate: 0.5 }}
            whileInView={{ opacity: 1, y: -16, rotate: 0.5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 ml-4"
          >
            <MenuImage src="/images/menu-2.png" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
