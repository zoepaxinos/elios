"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/* Wordmark intrinsic size. The footer shows the top two thirds — the bottom
   third falls below the bottom of the page. The container's aspect ratio is
   therefore the full width over two thirds of the natural height; the image
   itself is full height and unclipped, so overscrolling reveals the rest. */
const WORDMARK_W = 3225;
const WORDMARK_H = 922;
const VISIBLE_FRACTION = 2 / 3;

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden pt-14"
      style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG-tile.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}
    >
      {/* The box is two thirds of the wordmark's height and overflow-hidden
          clips the rest, so the bottom third is cropped out of frame entirely
          rather than painted below the footer. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="relative w-full"
        style={{ aspectRatio: `${WORDMARK_W} / ${WORDMARK_H * VISIBLE_FRACTION}` }}
      >
        <Image
          src="/images/elios-wordmark.png"
          alt="Elio's"
          width={WORDMARK_W}
          height={WORDMARK_H}
          sizes="100vw"
          className="absolute top-0 left-0 block w-full h-auto"
        />
      </motion.div>
    </footer>
  );
}
