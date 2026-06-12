"use client";

import { MotionConfig } from "framer-motion";

/**
 * Wraps the app so Framer Motion honours the user's
 * "prefers-reduced-motion" OS setting: transform/layout animations are
 * skipped (opacity fades are kept) for users who request reduced motion.
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
