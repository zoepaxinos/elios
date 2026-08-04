import type { ReactNode } from "react";

/**
 * Page heading, in the same IBM Plex Mono uppercase treatment as the contact
 * details block. One definition so About, Menu and Catering stay identical.
 *
 * Rendered as <h1>: these pages had no top-level heading after the site was
 * split into routes, so this is each page's document heading, not decoration.
 * It sits inside the section's max-w-7xl container so it lines up with the
 * content beneath it.
 */
export default function PageTitle({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto">
      <h1
        className="uppercase text-[#FFFFDC] text-[28px] sm:text-[36px] leading-[1.1] mb-10 sm:mb-14"
        style={{ fontFamily: "var(--font-plex-mono), monospace", letterSpacing: "0.02em" }}
      >
        {children}
      </h1>
    </div>
  );
}
