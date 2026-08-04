"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Map from "../map";
import SectionShell from "./section-shell";

export default function ContactSection({ cafeInfo }: { cafeInfo: any }) {
  // ── Contact details ──
  const addr = cafeInfo?.address || "70 Newlands Road";
  const phone = cafeInfo?.phone || "(03) 9191 0107";
  const email = cafeInfo?.email || "info@elioscoburg.com";
  const igHandle = (cafeInfo?.instagram || "elios.coburg")
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${addr}, Coburg North VIC 3058`,
  )}`;
  const hoursRows: { days: string; time: string }[] =
    cafeInfo?.hours && cafeInfo.hours.length > 0
      ? cafeInfo.hours.map((h: any) => ({ days: h.days, time: h.time }))
      : [
          { days: "Monday – Friday", time: "7am – 3pm" },
          { days: "Saturday", time: "8am – 2:30pm" },
          { days: "Sunday", time: "9am – 2:30pm" },
        ];

  return (
    <SectionShell id="contact" className="px-6 sm:px-10 pt-4 sm:pt-6 pb-20 sm:pb-32">
      {/* Loyalty card */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="absolute pointer-events-none"
        style={{ left: "calc(5% + 130px)", top: "calc(10% + 60px)", width: "clamp(152px, 17vw, 247px)" }}
      >
        <Image src="/images/sticker-loyalty-card.png" alt="" width={260} height={260} sizes="260px" className="w-full h-auto sticker-shadow -rotate-6" />
      </motion.div>


      {/* max-w-7xl matches About, Menu and Catering. This block was max-w-6xl
          from when it sat inside the single-page scroll; now that it renders on
          every page it needs the same content width as the rest of the site. */}
      <div className="max-w-7xl mx-auto">
        {/* Map (now above the contact text) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="h-[350px] sm:h-[420px] rounded-lg overflow-hidden map-container mb-14 sm:mb-16"
        >
          <Map />
        </motion.div>

        {/* Contact details — VISIT / CONTACT / HOURS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-16"
        >
          {/* VISIT */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-4"
              style={{ fontFamily: "var(--font-plex-mono), monospace", fontWeight: 500, color: "rgba(255,255,220,0.55)" }}
            >
              Visit
            </p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get directions"
              className="group block uppercase text-[#FFFFDC] hover:text-[#eeece6] transition-colors"
              style={{ fontFamily: "var(--font-plex-mono), monospace", letterSpacing: "0.02em" }}
            >
              <p className="text-[18px] leading-[1.2]">{addr}</p>
              <p className="text-[18px] leading-[1.2]">Coburg North, 3058</p>
              <p className="text-[18px] leading-[1.2]">
                Melbourne{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </p>
            </a>
          </div>

          {/* CONTACT */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-4"
              style={{ fontFamily: "var(--font-plex-mono), monospace", fontWeight: 500, color: "rgba(255,255,220,0.55)" }}
            >
              Contact
            </p>
            <div className="uppercase" style={{ fontFamily: "var(--font-plex-mono), monospace", letterSpacing: "0.02em" }}>
              <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="block text-[18px] leading-[1.2] text-[#FFFFDC] hover:text-[#eeece6] transition-colors">{phone}</a>
              <a href={`mailto:${email}`} className="block text-[18px] leading-[1.2] text-[#FFFFDC] hover:text-[#eeece6] transition-colors break-all">{email}</a>
              <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer" className="block text-[18px] leading-[1.2] text-[#FFFFDC] hover:text-[#eeece6] transition-colors">@{igHandle}</a>
            </div>
          </div>

          {/* HOURS */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-4"
              style={{ fontFamily: "var(--font-plex-mono), monospace", fontWeight: 500, color: "rgba(255,255,220,0.55)" }}
            >
              Hours
            </p>
            <div className="uppercase" style={{ fontFamily: "var(--font-plex-mono), monospace", letterSpacing: "0.02em" }}>
              {hoursRows.map((h, i) => (
                <div key={i} className="flex items-baseline leading-[1.2] text-[18px] text-[#FFFFDC]">
                  <span className="whitespace-nowrap">{h.days}</span>
                  <span aria-hidden="true" className="flex-1 overflow-hidden mx-2 text-[#FFFFDC]/40 tracking-[0.25em] whitespace-nowrap">............................................................</span>
                  <span className="whitespace-nowrap">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </SectionShell>
  );
}
