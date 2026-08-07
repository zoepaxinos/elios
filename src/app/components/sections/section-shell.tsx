import type { ReactNode } from "react";

/**
 * The dark textured background shared by every content section.
 * These four values were repeated inline six times in hero.tsx before the
 * multi-page split; this is the single definition. Do not alter them —
 * sections must render identically to before.
 */
const SECTION_BACKGROUND = {
  backgroundColor: "#13322b",
  backgroundImage: "url(/images/BG-tile.jpg)",
  backgroundSize: "1200px auto",
  backgroundRepeat: "repeat",
} as const;

export default function SectionShell({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`relative text-white ${className}`}
      style={SECTION_BACKGROUND}
    >
      {children}
    </section>
  );
}
