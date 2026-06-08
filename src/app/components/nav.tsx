"use client";

import { motion } from "framer-motion";

const pop = { type: "spring" as const, stiffness: 260, damping: 22 };

const defaultNavItems = [
  { label: "About", href: "#about" },
  { label: "Menu", href: "#menu" },
  { label: "Catering", href: "#catering" },
  { label: "Contact", href: "#contact" },
];

type NavProps = {
  items?: { label: string; href: string }[] | null;
};

export default function Nav({ items }: NavProps) {
  const navItems = items && items.length > 0 ? items : defaultNavItems;

  return (
    <nav className="relative z-40 flex justify-center gap-4 sm:gap-6 px-6 pt-8 sm:pt-10">
      {navItems.map((item, i) => (
        <motion.a
          key={item.label}
          href={item.href}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...pop, delay: 0.5 + i * 0.08 }}
          className="text-sm uppercase tracking-[0.04em] hover:text-[#eeece6] transition-colors"
          style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", fontWeight: 300, color: "#FFFFDC" }}
        >
          {item.label}
        </motion.a>
      ))}
    </nav>
  );
}
