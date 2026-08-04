import { type PortableTextComponents } from "@portabletext/react";

/* ── Portable Text ──
   Editors press Enter twice in Studio, which Sanity stores as empty blocks.
   Those render as zero-height <p></p> (Tailwind preflight zeroes p margins),
   so drop them and let the paragraph margin below own the spacing instead. */
export function withoutBlankBlocks(blocks: unknown): any[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.filter(
    (b: any) =>
      b?._type !== "block" ||
      (b.children ?? []).some((c: any) => (c?.text ?? "").trim() !== ""),
  );
}

export const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-4 last:mb-0 text-pretty">{children}</p>,
  },
};
