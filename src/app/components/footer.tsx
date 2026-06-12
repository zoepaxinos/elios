"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative py-14 text-center overflow-hidden" style={{ backgroundColor: "#13322b", backgroundImage: "url(/images/BG.jpg)", backgroundSize: "1200px auto", backgroundRepeat: "repeat" }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
      >
        <Image src="/images/logo-circle.png" alt="Elio's" width={371} height={371} className="mx-auto w-[80px] h-auto" />
      </motion.div>
    </footer>
  );
}
