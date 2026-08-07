"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { withoutBlankBlocks, portableTextComponents } from "../portable-text";
import SectionShell from "./section-shell";
import PageTitle from "./page-title";

/* Measured aperture of the polaroid frame in polaroid-elio.png, as a percentage
   inset from each edge, and the bleed applied to it. */
const APERTURE = { top: 6.98, left: 8.8, right: 7.04, bottom: 20.93 };
const BLEED = 0.9;

/* ── About video polaroid (Elio video) ── */
function AboutVideoPolaroid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="w-full rotate-3 drop-shadow-2xl"
    >
      <div className="relative">
        <Image src="/images/polaroid-elio.png" alt="Pete's son Elio" width={795} height={946} className="block w-full h-auto" />
        {/* Video sits on top of the polaroid's photo window, inset to the
            frame's aperture less a small bleed. The video paints over the frame
            image, so overlapping the aperture's inner edge is invisible while
            falling short of it shows as a hairline gap — hence erring outward.
            Raise BLEED if any gap remains. */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: `${APERTURE.top - BLEED}%`,
            left: `${APERTURE.left - BLEED}%`,
            right: `${APERTURE.right - BLEED}%`,
            bottom: `${APERTURE.bottom - BLEED}%`,
          }}
        >
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

export default function AboutSection({ aboutSection }: { aboutSection: any }) {
  return (
    <SectionShell id="about" className="px-6 sm:px-10 py-20 sm:py-32">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-12">
        {/* About graphic — three-generation polaroid composition */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-full md:w-[52%]"
        >
          {/* One scale for the whole composition — polaroids and dashed arrows
              alike — since everything inside is positioned in percentages
              relative to this box. Desktop is 10% down from the 1.15 the
              mobile stack keeps (1.15 x 0.9 = 1.035). The section switches to
              its side-by-side layout at md, so the override starts there. */}
          <div className="relative w-full aspect-[13/14] text-[#FFFFDC] scale-[1.15] md:scale-[1.035]" style={{ fontFamily: "var(--font-caveat)" }}>
            {/* Polaroid 1 — Pete's dad (B&W) */}
            <Image src="/images/polaroid-founders.png" alt="Pete's dad" width={1521} height={1518} sizes="(max-width: 768px) 42vw, 24vw" className="absolute left-[6%] top-[8%] w-[40%] h-auto drop-shadow-xl -rotate-3" />
            {/* Polaroid 2 — the family (Pete + Elio). This is also the anchor for
                the Elio video polaroid and its arrow: both are nested inside and
                hang off its bottom-right corner, so they track it at every
                viewport width. They previously sat on fixed px offsets against
                the outer container, which made them drift as it resized.
                Percentages below are relative to THIS polaroid, not the container. */}
            <div className="absolute left-[22%] top-[31%] w-[39%]">
              <Image src="/images/polaroid-family.png" alt="Pete's son Elio" width={400} height={470} sizes="(max-width: 768px) 40vw, 22vw" className="block w-full h-auto drop-shadow-xl -rotate-2" />

              {/* Polaroid 3 — the reason it all works (Elio video), pinned to the
                  bottom-right corner and pulled back to overlap it. */}
              <div className="absolute left-full top-full w-[82%] -translate-x-[38%] -translate-y-[34%]">
                {/* "Pete's son Elio" annotation. bottom-full puts its bottom edge on
                    this polaroid's top edge, so it sits clear of the photo instead of
                    across it — and being nested here it tracks the polaroid rather
                    than needing its own anchor. */}
                <img src="/images/arrow-elio.svg" alt="" aria-hidden="true" className="absolute bottom-full left-[calc(8%+60px)] mb-1 w-[86%] pointer-events-none" />
                <AboutVideoPolaroid />
              </div>
            </div>

            {/* Dashed arrows positioned against the whole composition */}
            <img src="/images/arrow-dad.svg" alt="" aria-hidden="true" className="absolute left-[calc(36%-50px)] top-[calc(6%-20px)] w-[48%] pointer-events-none" />
            <img src="/images/arrow-pete.svg" alt="" aria-hidden="true" className="absolute left-[1%] top-[52%] w-[47%] pointer-events-none" />
          </div>
        </motion.div>

        {/* About Us text */}
        <div className="flex-1">
          {/* Title sits with the copy rather than at the top of the section —
              the polaroid composition occupies the left half, so a full-width
              heading read as detached from the text it introduces. */}
          <PageTitle>About Us</PageTitle>
          {/* div, not p — PortableText emits block-level <p> children */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-[16px] leading-[19.2px] text-pretty text-[#FFFFDC] w-[85vw] sm:w-auto"
            style={{ fontFamily: "var(--font-work-sans), sans-serif", letterSpacing: "-0.04em" }}
          >
            {aboutSection?.body ? (
              <PortableText value={withoutBlankBlocks(aboutSection.body)} components={portableTextComponents} />
            ) : (
              <p>Elio&apos;s started with a simple idea: bring the kind of food you&apos;d actually eat in Italy, proper paninis, real focaccia, coffee that takes itself seriously without taking itself too seriously, to the corner of Newlands Road in <em className="italic">Coburg North.</em></p>
            )}
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}
