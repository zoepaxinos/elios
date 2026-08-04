"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Fallback when Sanity has no navigation document. Paths, not anchors —
// each section now lives on its own route. Contact is intentionally absent:
// the contact block renders at the bottom of every page.
const defaultNavItems = [
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Catering", href: "/catering" },
];

type NavProps = {
  items?: { label: string; href: string }[] | null;
};

/* ── deterministic pseudo-random so each item's circle is stable ── */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* A loose, hand-drawn loop around the item — slightly irregular, over-drawn past the start. */
function circlePath(w: number, h: number, rng: () => number) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 1.5;
  const ry = h / 2 - 1.5;
  const start = -Math.PI * 0.6;
  const turn = Math.PI * 2 + 0.5; // overshoot past the start for a hand-drawn feel
  const steps = 28;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = start + turn * (i / steps);
    const jr = 1 + (rng() * 2 - 1) * 0.03;
    const x = cx + Math.cos(a) * rx * jr + (rng() * 2 - 1) * 0.6;
    const y = cy + Math.sin(a) * ry * jr + (rng() * 2 - 1) * 0.6;
    pts.push([x, y]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  return d;
}

const PAD_X = 14;
const PAD_Y = 7;

function SketchCircle({ w, h, seed, active }: { w: number; h: number; seed: string; active: boolean }) {
  const boxW = w + PAD_X * 2;
  const boxH = h + PAD_Y * 2;
  const d = useMemo(() => circlePath(boxW, boxH, mulberry32(hashStr(seed))), [boxW, boxH, seed]);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute overflow-visible"
      style={{ left: -PAD_X, top: -PAD_Y, width: boxW, height: boxH }}
      viewBox={`0 0 ${boxW} ${boxH}`}
      preserveAspectRatio="none"
    >
      <motion.path
        d={d}
        stroke="#FFFFDC"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        initial={false}
        animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function NavItem({ item, active }: { item: { label: string; href: string }; active: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      href={item.href}
      className="relative text-[12px] uppercase tracking-[0.1em] hover:text-[#eeece6] transition-colors"
      style={{ fontFamily: "Futura, 'Trebuchet MS', sans-serif", fontWeight: 300, color: "#FFFFDC", textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}
    >
      <span className="relative z-10">{item.label}</span>
      {size.w > 0 && <SketchCircle w={size.w} h={size.h} seed={item.label} active={active} />}
    </Link>
  );
}

export default function Nav({ items }: NavProps) {
  const navItems = items && items.length > 0 ? items : defaultNavItems;
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[10000] flex justify-between sm:justify-center gap-0 sm:gap-[43px] px-5 sm:px-4 pt-3 sm:pt-4">
      {navItems.map((item) => (
        <NavItem key={item.label} item={item} active={pathname === item.href} />
      ))}
    </nav>
  );
}
