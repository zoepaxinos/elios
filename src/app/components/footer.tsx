"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/* Wordmark intrinsic size. The footer shows only the top 75% — the lower
   quarter bleeds off the bottom of the page. The container's aspect ratio is
   therefore the full width over three quarters of the natural height, and the
   image, sized to full width with auto height, overflows and is clipped. */
const WORDMARK_W = 3225;
const WORDMARK_H = 922;
const VISIBLE_FRACTION = 0.75;

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden pt-14"
      style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `${WORDMARK_W} / ${WORDMARK_H * VISIBLE_FRACTION}` }}
      >
        <Image
          src="/images/elios-wordmark.png"
          alt="Elio's"
          width={WORDMARK_W}
          height={WORDMARK_H}
          sizes="100vw"
          className="block w-full h-auto"
        />
      </motion.div>
    </footer>
  );
}
