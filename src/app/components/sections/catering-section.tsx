"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { withoutBlankBlocks, portableTextComponents } from "../portable-text";
import SectionShell from "./section-shell";
import PageTitle from "./page-title";

/* ── Catering enquiry form (mailto submit) ── */
const CATERING_FUTURA = "Futura, 'Trebuchet MS', sans-serif";
const cateringFieldClass =
  "w-full rounded-md bg-[#102a23] px-4 text-[#41635C] text-[16px] sm:text-[12px] outline-none placeholder:uppercase placeholder:tracking-[0.06em] placeholder:text-[#41635C] shadow-[inset_0_2px_3px_rgba(0,0,0,0.15),inset_0_2px_9px_3px_rgba(0,0,0,0.15)] focus:ring-1 focus:ring-[#FFFFDC]/30 transition";

function CateringEnquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Catering enquiry${name ? ` — ${name}` : ""}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Event date: ${eventDate}`,
      "",
      message,
    ].join("\n");
    window.location.href = `mailto:info@elioscoburg.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12 max-w-xl"
    >
      <h3
        className="mb-6 text-[12px] uppercase tracking-[0.04em] font-light"
        style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", color: "rgba(255, 255, 220, 0.8)" }}
      >
        Catering enquiry
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={`${cateringFieldClass} h-[45px]`}
          style={{ fontFamily: CATERING_FUTURA }}
        />
        {/* Starts as type="text" so the "Event date" placeholder shows —
            type="date" ignores placeholders — then swaps to a real date input
            for the native picker.

            The swap happens on pointerdown, which fires BEFORE focus. Doing it
            in onFocus (as this did) changes the element's type while it is
            being focused, and several mobile browsers drop the focus in
            response, so the picker only opens on a second tap. onFocus is kept
            as the keyboard-navigation path, where no pointer event occurs. */}
        <input
          type="text"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          onPointerDown={(e) => {
            e.currentTarget.type = "date";
          }}
          onFocus={(e) => {
            e.currentTarget.type = "date";
          }}
          onBlur={(e) => {
            if (!e.currentTarget.value) e.currentTarget.type = "text";
          }}
          placeholder="Event date"
          className={`${cateringFieldClass} h-[45px]`}
          style={{ fontFamily: CATERING_FUTURA, colorScheme: "dark" }}
        />
      </div>

      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className={`${cateringFieldClass} h-[45px] mt-3 sm:mt-4`}
        style={{ fontFamily: CATERING_FUTURA }}
      />

      <div className="relative mt-3 sm:mt-4">
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setMessageOpen(true)}
          onBlur={() => setMessageOpen(message.trim().length > 0)}
          placeholder="Message"
          className={`${cateringFieldClass} block py-3 pr-[120px] resize-none overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
          style={{ fontFamily: CATERING_FUTURA, height: messageOpen ? 150 : 45 }}
        />
        <button
          type="submit"
          className="absolute bottom-1.5 right-1.5 flex items-center h-[33px] px-6 bg-[#13322c] text-[#FFFFDC] text-[12px] uppercase tracking-[0.08em] rounded shadow-[0px_2px_6px_2px_rgba(0,0,0,0.15)] hover:bg-[#1a4034] transition-colors"
          style={{ fontFamily: CATERING_FUTURA }}
        >
          Submit
        </button>
      </div>
    </motion.form>
  );
}

export default function CateringSection({ cafeInfo }: { cafeInfo: any }) {
  return (
    <SectionShell id="catering" className="px-6 sm:px-10 pt-20 sm:pt-32 pb-4 sm:pb-6">
      <PageTitle>Catering</PageTitle>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-12">
        {/* Left side — stickers and images */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-full md:w-[50%] relative min-h-[300px] sm:min-h-[420px] md:min-h-[660px]"
        >
          {/* Polaroid */}
          <motion.div
            initial={{ opacity: 0, rotate: 10 }}
            whileInView={{ opacity: 1, rotate: -6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="absolute right-[3%] top-[2%]"
            style={{ width: "clamp(144px, 16vw, 240px)" }}
          >
            <Image src="/images/catering-family-polaroid.png" alt="Elio's family" width={885} height={1020} sizes="408px" className="w-full h-auto drop-shadow-xl" />
          </motion.div>

          {/* Catering polaroid */}
          <motion.div
            initial={{ opacity: 0, rotate: 15 }}
            whileInView={{ opacity: 1, rotate: 6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="absolute right-[18%] top-[12%]"
            style={{ width: "clamp(143px, 17vw, 242px)" }}
          >
            <Image src="/images/catering-polaroid.png" alt="Catering" width={408} height={491} sizes="408px" className="w-full h-auto drop-shadow-xl" />
          </motion.div>

          {/* Holding panini — bleeds off the left page edge */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="absolute left-[-14%] top-[2%]"
            style={{ width: "clamp(240px, 30vw, 450px)" }}
          >
            <Image src="/images/sticker-holding-panini-v2.png" alt="" width={300} height={300} sizes="300px" className="w-full h-auto sticker-shadow" />
          </motion.div>

          {/* Tomato sticker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.35 }}
            className="absolute right-[calc(6%+170px)] top-[calc(4%+120px)]"
            style={{ width: "clamp(144px, 17vw, 240px)" }}
          >
            <Image src="/images/sticker-tomato-single.png" alt="" width={304} height={304} sizes="304px" className="w-full h-auto sticker-shadow" />
          </motion.div>

        </motion.div>

        {/* Right side — text */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {cafeInfo?.cateringText ? (
              <div className="text-[16px] leading-[19.2px] text-pretty text-[#FFFFDC] w-[85vw] sm:w-auto" style={{ fontFamily: "var(--font-work-sans), sans-serif", letterSpacing: "-0.04em" }}>
                <PortableText value={withoutBlankBlocks(cafeInfo.cateringText)} components={portableTextComponents} />
              </div>
            ) : (
              <>
                <p className="text-[16px] leading-[19.2px] text-pretty text-[#FFFFDC] mb-8 w-[85vw] sm:w-auto" style={{ fontFamily: "var(--font-work-sans), sans-serif", letterSpacing: "-0.04em" }}>
                  From office lunches to private events, we bring Elio&apos;s to you. Our catering menu features our signature paninis, fresh focaccia, platters, and of course, proper Italian coffee.
                </p>
                <p className="text-[16px] leading-[19.2px] text-pretty text-[#FFFFDC] mb-12 w-[85vw] sm:w-auto" style={{ fontFamily: "var(--font-work-sans), sans-serif", letterSpacing: "-0.04em" }}>
                  Get in touch to discuss your next event.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-12" style={{ fontFamily: "var(--font-work-sans), sans-serif" }}>
                  <div>
                    <p className="text-[16px] leading-[19.2px] text-[#FFFFDC]">(03) 9191 0107</p>
                    <a href="mailto:info@elioscoburg.com" className="block text-[16px] leading-[19.2px] text-[#FFFFDC] hover:text-white transition-colors">info@elioscoburg.com</a>
                  </div>
                  <div>
                    <a href="https://instagram.com/elios.coburg" target="_blank" rel="noopener noreferrer" className="text-[16px] leading-[19.2px] text-[#FFFFDC] underline underline-offset-4 hover:text-white transition-colors" style={{ fontFamily: "var(--font-work-sans), sans-serif", letterSpacing: "-0.04em" }}>@elios.coburg</a>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          <CateringEnquiryForm />

          {/* Cup + panini-receipts below the enquiry form — mobile only */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="mt-[18px] sm:hidden"
          >
            {/* Mobile: cup nestled in the panini-with-receipts bottom-right corner (panini 8% smaller) */}
            <div className="relative inline-block sm:hidden">
              <Image src="/images/panini-receipts.png" alt="" width={1260} height={1620} sizes="260px" className="block h-auto sticker-shadow" style={{ width: "clamp(258px, 37vw, 313px)" }} />
              <Image src="/images/sticker-cup.png" alt="" width={180} height={180} sizes="110px" className="absolute bottom-0 right-0 h-auto sticker-shadow" style={{ width: "clamp(96px, 28vw, 120px)" }} />
            </div>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}
