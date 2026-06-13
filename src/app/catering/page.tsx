"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import PageLayout from "../components/page-layout";

export default function CateringPage() {
  return (
    <PageLayout>
      <section className="relative px-6 sm:px-10 py-20 sm:py-32">
        {/* Sticker decoration */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="absolute right-[5%] top-[10%] pointer-events-none"
          style={{ width: "clamp(140px, 16vw, 240px)" }}
        >
          <Image src="/images/sticker-cup.png" alt="" width={180} height={180} className="w-full h-auto drop-shadow-lg" />
        </motion.div>

        {/* Ninja turtles sticker */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="absolute left-[3%] bottom-[10%] pointer-events-none overflow-hidden"
          style={{ width: "clamp(168px, 22vw, 336px)", aspectRatio: "3 / 1" }}
        >
          <Image src="/images/sticker-15.png" alt="" width={346} height={346} className="w-full h-auto drop-shadow-lg" />
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-[20px] uppercase tracking-[0.04em] text-white/50 mb-8 font-light"
            style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif" }}
          >
            Catering
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-base sm:text-lg md:text-[24px] leading-[0.95] text-[#eeece6] mb-8"
              style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}
            >
              From office lunches to private events, we bring Elio&apos;s to you. Our catering menu features
              our signature paninis, fresh focaccia, platters, and of course, proper Italian coffee.
            </p>
            <p
              className="text-base sm:text-lg md:text-[24px] leading-[0.95] text-[#eeece6] mb-12"
              style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}
            >
              Get in touch to discuss your next event.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-12" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              <div>
                <p className="text-[#eeece6] text-lg leading-relaxed">(03) 9191 0107</p>
                <a href="mailto:info@elioscoburg.com" className="block text-[#eeece6] text-lg leading-relaxed hover:text-white transition-colors">info@elioscoburg.com</a>
              </div>
              <div>
                <a
                  href="https://instagram.com/elios.coburg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#eeece6] text-lg leading-relaxed underline underline-offset-4 hover:text-white transition-colors"
                >
                  @elios.coburg
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
