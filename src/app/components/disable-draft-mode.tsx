"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool();
  if (isPresentationTool) return null;

  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 z-[999999] rounded-full bg-white px-4 py-2 text-sm text-black shadow-lg"
    >
      Disable Draft Mode
    </a>
  );
}
