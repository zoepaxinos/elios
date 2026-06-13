"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import PageLayout from "../components/page-layout";

export default function ContactPage() {
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <PageLayout>
      <section className="relative px-6 sm:px-10 py-20 sm:py-32">
        {/* Interactive polaroid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 20 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 5 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 420, damping: 32, delay: 0.3 }}
          className="absolute right-[8%] top-[8%]"
          style={{ width: "clamp(180px, 20vw, 280px)" }}
        >
          <div className="relative">
            <Image src="/images/polaroid-frame-empty.png" alt="" width={408} height={491} className="w-full h-auto" />
            <div
              className="absolute inset-[8%_9%_22%_9%] overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="Your photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#f5f3ed] flex flex-col items-center justify-center gap-2 text-[#45403a]/40 group-hover:text-[#45403a]/60 transition-colors">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif" }}>Add your photo</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <div className="absolute inset-0 shadow-[inset_0_2px_6px_3px_rgba(0,0,0,0.08)]" />
            </div>
            <div className="absolute bottom-[4%] left-[12%] right-[12%]">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="sign here..."
                maxLength={30}
                className="w-full bg-transparent border-none outline-none font-handwriting text-xl sm:text-2xl text-[#45403a]/70 placeholder:text-[#45403a]/25 text-center cursor-text"
              />
            </div>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <p
            className="text-[20px] uppercase tracking-[0.04em] text-white/50 mb-10 font-light"
            style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif" }}
          >
            Contact
          </p>
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-16"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            <div>
              <p className="text-[#eeece6] text-2xl leading-relaxed">70 Newlands Road</p>
              <p className="text-[#eeece6] text-2xl leading-relaxed">Coburg North, 3058</p>
              <p className="text-[#eeece6] text-2xl leading-relaxed">Melbourne</p>
            </div>
            <div>
              <p className="text-[#eeece6] text-2xl leading-relaxed">elios.coburg</p>
              <p className="text-[#eeece6] text-2xl leading-relaxed">(03) 9191 0107</p>
              <a href="mailto:info@elioscoburg.com" className="block text-[#eeece6] text-2xl leading-relaxed hover:text-white transition-colors">info@elioscoburg.com</a>
            </div>
            <div>
              <p className="text-[#eeece6] text-2xl leading-relaxed">Monday – Friday 7am – 2:30pm</p>
              <p className="text-[#eeece6] text-2xl leading-relaxed">Saturday 8am – 2:30pm</p>
              <p className="text-[#eeece6] text-2xl leading-relaxed">Sunday 9am – 2:30pm</p>
            </div>
          </div>
          <div className="flex items-center gap-5 mt-8">
            <a href="https://instagram.com/elios.coburg" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,0.5)" stroke="none" />
              </svg>
            </a>
            <a href="mailto:info@elioscoburg.com" aria-label="Email">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
