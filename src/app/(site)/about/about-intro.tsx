"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const pop = { type: "spring" as const, stiffness: 420, damping: 32 };

export default function AboutIntro() {
  return (
    <section className="relative px-6 sm:px-10 py-20 sm:py-32 overflow-hidden" style={{ minHeight: "clamp(600px, 50vw, 900px)" }}>
      {/* Polaroid — Pete */}
      <motion.div
        initial={{ opacity: 0, x: -24, rotate: -20 }}
        whileInView={{ opacity: 1, x: 0, rotate: -4 }}
        viewport={{ once: true }}
        transition={{ ...pop, delay: 0.1 }}
        className="absolute"
        style={{ top: "10%", left: "5%", width: "clamp(180px, 20vw, 310px)" }}
      >
        <Image src="/images/Elios_Polaroids_Pete.png" alt="Pete" width={408} height={491} className="w-full h-auto drop-shadow-xl" />
      </motion.div>

      {/* Polaroid — Elio */}
      <motion.div
        initial={{ opacity: 0, x: -16, rotate: 15 }}
        whileInView={{ opacity: 1, x: 0, rotate: 0.5 }}
        viewport={{ once: true }}
        transition={{ ...pop, delay: 0.2 }}
        className="absolute"
        style={{ top: "18%", left: "18%", width: "clamp(190px, 22vw, 330px)" }}
      >
        <Image src="/images/Elios_Polaroids_Elio.png" alt="Elio" width={408} height={491} className="w-full h-auto drop-shadow-xl" />
      </motion.div>

      {/* "I'm Pete" handwritten */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.4 }}
        className="absolute z-30 pointer-events-none"
        style={{ top: "6%", left: "34%", width: "clamp(120px, 16vw, 240px)" }}
      >
        <Image src="/images/text-im-pete.png" alt="I'm Pete" width={1100} height={280} className="w-full h-auto" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.5 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="absolute z-30 pointer-events-none"
        style={{ top: "12%", left: "28%", width: "clamp(100px, 14vw, 220px)" }}
      >
        <Image src="/images/arrow-pete.png" alt="" width={1228} height={658} className="w-full h-auto" />
      </motion.div>

      {/* "Meet Elio" handwritten */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.5 }}
        className="absolute z-30 pointer-events-none"
        style={{ top: "calc(58% + 60px)", left: "30%", width: "clamp(120px, 16vw, 240px)" }}
      >
        <Image src="/images/text-meet-elio.png" alt="Meet Elio" width={820} height={240} className="w-full h-auto" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.5 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: 0.35 }}
        className="absolute z-30 pointer-events-none"
        style={{ top: "55%", left: "26%", width: "clamp(100px, 14vw, 220px)" }}
      >
        <Image src="/images/arrow-elio.png" alt="" width={1558} height={752} className="w-full h-auto" />
      </motion.div>

      {/* About Us text */}
      <div className="absolute z-30" style={{ top: "20%", left: "60%", maxWidth: "min(500px, 30vw)" }}>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-[20px] uppercase tracking-[0.04em] text-white/50 mb-4 font-light"
          style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif" }}
        >
          About Us
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-[16px] leading-[19.2px] text-pretty text-[#eeece6]"
          style={{ fontFamily: "var(--font-work-sans), sans-serif", letterSpacing: "-0.04em" }}
        >
          Elio&apos;s started with a simple idea: bring the kind of food you&apos;d actually eat in Italy, proper paninis,
          real focaccia, coffee that takes itself seriously without taking itself too seriously, to the corner of Newlands
          Road in <em className="italic">Coburg North.</em>
        </motion.p>
      </div>

      {/* Loyalty card */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.4 }}
        className="absolute right-[3%] top-[5%]"
        style={{ width: "clamp(160px, 18vw, 260px)" }}
      >
        <Image src="/images/sticker-loyalty-card.png" alt="" width={240} height={240} className="w-full h-auto drop-shadow-lg -rotate-6" />
      </motion.div>

      {/* Playing cards polaroid */}
      <motion.div
        initial={{ opacity: 0, rotate: 15 }}
        whileInView={{ opacity: 1, rotate: 6 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.5 }}
        className="absolute right-[8%] bottom-[10%]"
        style={{ width: "clamp(140px, 16vw, 240px)" }}
      >
        <Image src="/images/Elios_Polaroids_PlayingCards.png" alt="Playing cards" width={408} height={491} className="w-full h-auto drop-shadow-xl" />
      </motion.div>

      {/* Coffee bean sticker */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ ...pop, delay: 0.3 }}
        className="absolute pointer-events-none"
        style={{ bottom: "5%", left: "2%", width: "clamp(140px, 18vw, 280px)" }}
      >
        <Image src="/images/sticker-5.png" alt="" width={346} height={346} className="w-full h-auto drop-shadow-lg" />
      </motion.div>
    </section>
  );
}
