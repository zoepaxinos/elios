# Multi-page Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single-page site into separate routes — `/`, `/about`, `/menu`, `/catering` — with contact details at the bottom of every page.

**Architecture:** Extract each `<section>` from the 1101-line `hero.tsx` into its own client component under `src/app/components/sections/`. Introduce a `(site)` route group whose server layout fetches `cafeInfo` + `navigation` once and renders Nav → children → ContactSection → Footer. Each route's `page.tsx` becomes a server component fetching only the data it renders.

**Tech Stack:** Next.js 16.2.6 (App Router, Turbopack), React 19.2.4, TypeScript, Tailwind CSS v4, framer-motion 12, GSAP 3.15, next-sanity 12.

**Source spec:** `docs/superpowers/specs/2026-08-04-multipage-split-design.md`

## Global Constraints

- **No visual redesign.** Sections move; they must render identically. Any appearance change is a defect.
- **Mobile hero must not change.** `mobileSpine` and the `sm:hidden` hero block are untouched.
- **`/studio` must not receive site chrome.** It renders its own `<html>`/`<body>` and stays outside the `(site)` group. No Nav, no ContactSection, no Footer.
- **Route group `(site)` does not change URLs.** `(site)/about/page.tsx` serves `/about`.
- **`/about` keeps its existing Pete/Elio content.** The extracted `<AboutSection>` is *appended below* it, not substituted for it.
- **`/contact` is deleted** — it must return 404. Contact details live at the bottom of every page instead.
- **Nav has three items** after this work: About, Menu, Catering. Contact is removed.
- **A layout cannot pass props to a page.** `layout.tsx` receives `children` as an already-constructed element. Pages needing `cafeInfo` fetch it themselves.
- **Section background, verbatim** — `backgroundColor: "#13322b"`, `backgroundImage: "url(/images/BG.jpg)"`, `backgroundSize: "1200px auto"`, `backgroundRepeat: "repeat"`.
- **This repo has NO test framework.** `package.json` scripts are exactly `dev`, `build`, `start`, `lint`. There is no jest/vitest/playwright and this plan does not add one. Verification is by executable commands (`tsc`, `eslint`, `next build`, `curl` + HTML assertions). Do not write `.test.ts` files; there is no runner.
- **`npx eslint src/app/hero.tsx` currently reports 21 problems (13 errors, 8 warnings), all pre-existing.** `LINT_OK` is not achievable for that file. The bar is: **no increase**.
- **Dev server** runs on `http://localhost:3000` via `yarn dev`. Do not start, stop or restart it; Turbopack hot-reloads.
- **Never `git add -A` or `git add .`** — stage explicit paths. The tree may hold unrelated uncommitted work.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app/components/sections/section-shell.tsx` | **New.** The repeated dark background + padding wrapper. One definition replacing six inline copies. |
| `src/app/components/portable-text.tsx` | **New.** `withoutBlankBlocks` + `portableTextComponents`, shared by About and Catering. |
| `src/app/components/sections/contact-section.tsx` | **New.** `#contact` — map, VISIT/CONTACT/HOURS. Rendered by the layout on every page. |
| `src/app/components/sections/reels-section.tsx` | **New.** `ReelsSection`, moved out of `hero.tsx`. |
| `src/app/components/sections/about-section.tsx` | **New.** `#about` + `AboutVideoPolaroid`. |
| `src/app/components/sections/menu-section.tsx` | **New.** `#menu` + `MenuBook`. |
| `src/app/components/sections/catering-section.tsx` | **New.** `#catering` + `CateringEnquiryForm`. |
| `src/app/(site)/layout.tsx` | **New.** Server. Fetches `cafeInfo` + `navigation`; renders Nav → children → ContactSection → Footer. |
| `src/app/(site)/page.tsx` | **Moved** from `src/app/page.tsx`. Hero + ReelsSection. |
| `src/app/(site)/about/page.tsx` | **New.** Existing About content + `<AboutSection>`. |
| `src/app/(site)/menu/page.tsx` | **New.** `<MenuSection>`. |
| `src/app/(site)/catering/page.tsx` | **New.** `<CateringSection>`. |
| `src/app/hero.tsx` | **Modified.** Hero only; ~1101 → ~400 lines. |
| `src/app/components/nav.tsx` | **Modified.** `usePathname()` instead of IntersectionObserver; `<Link>` instead of `<a>`. |
| `src/app/components/page-layout.tsx` | **Deleted.** Superseded by the `(site)` layout. |
| `src/app/about/page.tsx` | **Deleted** after its content moves to `(site)/about/page.tsx`. |
| `src/app/menu/page.tsx`, `src/app/contact/page.tsx` | **Deleted.** |

### Measured section boundaries in `hero.tsx`

Current line numbers. **They shift as you edit — anchor on the `id` attribute, not the number.**

| Section | Lines | Data it references |
|---|---|---|
| hero (no `id`) | 683–792 | none |
| `id="about"` | 793–839 | `aboutSection` |
| `id="menu"` | 840–878 | `menu`, `menuPages` |
| `<ReelsSection …/>` call | 876 | `instagramReels` |
| `id="catering"` | 879–992 | `cafeInfo`, `cateringText` |
| `id="contact"` | 993–1102 | `addr`, `phone`, `email`, `igHandle`, `hoursRows` |

`<ReelsSection>` is rendered at line 876, **after** the menu section's closing `</section>` at 873. It is a sibling, not a child.

**Data-tracing warning.** `hero.tsx` derives locals near the top of the `Hero` function — `addr`, `phone`, `email`, `igHandle`, `hoursRows`, `directionsUrl` — from `cafeInfo`. The contact section uses those locals, not `cafeInfo` directly, so a grep for `cafeInfo` inside the contact range returns nothing. Every extracted section must have its derived locals traced and moved with it.

---

## Task 1: Shared primitives

**Files:**
- Create: `src/app/components/sections/section-shell.tsx`
- Create: `src/app/components/portable-text.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export default function SectionShell(props: { id?: string; className?: string; children: React.ReactNode }): JSX.Element`
  - `export function withoutBlankBlocks(blocks: unknown): any[]`
  - `export const portableTextComponents: PortableTextComponents`

- [ ] **Step 1: Create `section-shell.tsx`**

```tsx
import type { ReactNode } from "react";

/**
 * The dark textured background shared by every content section.
 * These four values were repeated inline six times in hero.tsx before the
 * multi-page split; this is the single definition. Do not alter them —
 * sections must render identically to before.
 */
const SECTION_BACKGROUND = {
  backgroundColor: "#13322b",
  backgroundImage: "url(/images/BG.jpg)",
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
```

- [ ] **Step 2: Create `portable-text.tsx`**

Move these verbatim out of `hero.tsx` (currently lines 12–29). Do not change the logic or the comment — the comment records why the helper exists.

```tsx
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
```

- [ ] **Step 3: Verify**

```bash
cd /Users/zoepaxinos/elios
npx tsc --noEmit && echo "TSC_OK"
npx eslint src/app/components/sections/section-shell.tsx src/app/components/portable-text.tsx && echo "LINT_OK"
```

Expected: `TSC_OK` and `LINT_OK`. `hero.tsx` still has its own copies at this point — that is expected; Task 3 removes them.

- [ ] **Step 4: Commit**

```bash
cd /Users/zoepaxinos/elios
git add src/app/components/sections/section-shell.tsx src/app/components/portable-text.tsx
git commit -m "refactor: extract SectionShell and shared PortableText config"
```

---

## Task 2: Extract ContactSection and ReelsSection

These two come first because the layout (Task 4) depends on `ContactSection`, and the home page (Task 5) depends on `ReelsSection`.

**Files:**
- Create: `src/app/components/sections/contact-section.tsx`
- Create: `src/app/components/sections/reels-section.tsx`
- Modify: `src/app/hero.tsx` — remove the extracted code

**Interfaces:**
- Consumes: `SectionShell` from Task 1.
- Produces:
  - `export default function ContactSection({ cafeInfo }: { cafeInfo: any }): JSX.Element`
  - `export default function ReelsSection({ heading, reels }: { heading?: string; reels?: { url: string }[] }): JSX.Element`

  Task 4 renders `<ContactSection cafeInfo={cafeInfo} />`. Task 5 renders `<ReelsSection heading={…} reels={…} />`.

- [ ] **Step 1: Create `contact-section.tsx`**

Start the file with:

```tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Map from "../map";
import SectionShell from "./section-shell";

export default function ContactSection({ cafeInfo }: { cafeInfo: any }) {
```

Then move, **verbatim**, from `hero.tsx`:

1. The derived contact locals from the top of `Hero` — `addr`, `phone`, `email`, `igHandle`, `directionsUrl`, `hoursRows`, including the `/* ── Contact details ── */` comment and every fallback default. These are the values the section actually reads.
2. The entire `<section id="contact">` … `</section>` block.

Convert the outer `<section id="contact" className="…" style={{…}}>` to `<SectionShell id="contact" className="px-6 sm:px-10 pt-4 sm:pt-6 pb-20 sm:pb-32">`, dropping the inline `style` (SectionShell supplies it). Keep every inner class and element unchanged.

- [ ] **Step 2: Create `reels-section.tsx`**

Move the `ReelsSection` function from `hero.tsx` (currently ~583–608) verbatim into its own file, adding `"use client";` and its imports, and changing `function ReelsSection` to `export default function ReelsSection`. Keep the props signature exactly: `{ heading, reels }: { heading?: string; reels?: { url: string }[] }`.

- [ ] **Step 3: Remove the extracted code from `hero.tsx`**

Delete: the `ReelsSection` function, the `<ReelsSection …/>` call site, the `<section id="contact">` block, and the contact-derived locals — **but only those locals nothing else still uses.** Check each before deleting; `addr` in particular may be referenced elsewhere.

- [ ] **Step 4: Verify no duplication and no dangling references**

```bash
cd /Users/zoepaxinos/elios
echo "id=contact in hero (expect 0):"; grep -c 'id="contact"' src/app/hero.tsx
echo "ReelsSection in hero (expect 0):"; grep -c 'ReelsSection' src/app/hero.tsx
echo "id=contact in new file (expect 1):"; grep -c 'id="contact"' src/app/components/sections/contact-section.tsx
npx tsc --noEmit && echo "TSC_OK"
```

Expected: `0`, `0`, `1`, `TSC_OK`. A TypeScript error naming an undefined local means a derived value was deleted while still in use — restore it rather than deleting its remaining use.

- [ ] **Step 5: Verify lint has not regressed**

```bash
cd /Users/zoepaxinos/elios
npx eslint src/app/hero.tsx 2>&1 | tail -2
npx eslint src/app/components/sections/contact-section.tsx src/app/components/sections/reels-section.tsx 2>&1 | tail -2
```

Expected: `hero.tsx` at **21 problems or fewer** (it was 21 before this work; removing code should not add any). The two new files should be clean.

- [ ] **Step 6: Commit**

```bash
cd /Users/zoepaxinos/elios
git add src/app/components/sections/contact-section.tsx src/app/components/sections/reels-section.tsx src/app/hero.tsx
git commit -m "refactor: extract ContactSection and ReelsSection from hero"
```

---

## Task 3: Extract AboutSection, MenuSection, CateringSection

**Files:**
- Create: `src/app/components/sections/about-section.tsx`
- Create: `src/app/components/sections/menu-section.tsx`
- Create: `src/app/components/sections/catering-section.tsx`
- Modify: `src/app/hero.tsx`

**Interfaces:**
- Consumes: `SectionShell`, `withoutBlankBlocks`, `portableTextComponents` from Task 1.
- Produces:
  - `export default function AboutSection({ aboutSection }: { aboutSection: any }): JSX.Element`
  - `export default function MenuSection({ menu, menuPages }: { menu: any[]; menuPages: string[] }): JSX.Element`
  - `export default function CateringSection({ cafeInfo }: { cafeInfo: any }): JSX.Element`

  Task 5 renders these with exactly those prop names.

- [ ] **Step 1: Create `about-section.tsx`**

Move `<section id="about">` and the `AboutVideoPolaroid` function verbatim. Convert the outer section to `<SectionShell id="about" className="px-6 sm:px-10 py-20 sm:py-32">`. Import `withoutBlankBlocks` and `portableTextComponents` from `../portable-text` rather than redefining them.

- [ ] **Step 2: Create `menu-section.tsx`**

Move `<section id="menu">` and the `MenuBook` function (currently ~50–240) verbatim, along with the module constants `MenuBook` depends on: `defaultMenuPages`, `foldPages`, `foldToSpread`. Convert the outer section to `<SectionShell id="menu" className="px-6 sm:px-10 pt-10 pb-20 sm:pb-32">`.

- [ ] **Step 3: Create `catering-section.tsx`**

Move `<section id="catering">` and the `CateringEnquiryForm` function verbatim, along with the `CATERING_FUTURA` constant it uses. Convert the outer section to `<SectionShell id="catering" className="px-6 sm:px-10 pt-20 sm:pt-32 pb-4 sm:pb-6">`. Import the PortableText helpers from `../portable-text`.

- [ ] **Step 4: Remove all three from `hero.tsx`, and its now-duplicate helpers**

Delete the three sections and their moved helper functions, plus `hero.tsx`'s own copies of `withoutBlankBlocks` and `portableTextComponents` (Task 1 moved them to a shared module).

Leave `Draggable`, `PhotoPolaroid`, `InteractivePolaroid` in place — they are pre-existing dead code and out of scope.

- [ ] **Step 5: Verify the extraction is complete and exclusive**

```bash
cd /Users/zoepaxinos/elios
for id in about menu catering contact; do
  printf "  id=%s in hero.tsx: %s (expect 0)\n" "$id" "$(grep -c "id=\"$id\"" src/app/hero.tsx)"
done
printf "  MenuBook in hero.tsx:            %s (expect 0)\n" "$(grep -c 'MenuBook' src/app/hero.tsx)"
printf "  CateringEnquiryForm in hero.tsx: %s (expect 0)\n" "$(grep -c 'CateringEnquiryForm' src/app/hero.tsx)"
printf "  withoutBlankBlocks in hero.tsx:  %s (expect 0)\n" "$(grep -c 'withoutBlankBlocks' src/app/hero.tsx)"
printf "  hero.tsx line count:             %s (expect ~400)\n" "$(wc -l < src/app/hero.tsx)"
printf "  mobileSpine in hero.tsx:         %s (expect 2 - MUST survive)\n" "$(grep -c 'mobileSpine' src/app/hero.tsx)"
printf "  heroTrailItems in hero.tsx:      %s (expect 2 - MUST survive)\n" "$(grep -c 'heroTrailItems' src/app/hero.tsx)"
npx tsc --noEmit && echo "TSC_OK"
```

A `mobileSpine` or `heroTrailItems` count other than 2 means the hero itself was damaged — revert and redo.

- [ ] **Step 6: Verify lint has not regressed**

```bash
cd /Users/zoepaxinos/elios
npx eslint src/app/hero.tsx 2>&1 | tail -2
npx eslint src/app/components/sections/ 2>&1 | tail -2
```

Expected: `hero.tsx` at 21 problems or fewer; the sections directory clean.

- [ ] **Step 7: Commit**

```bash
cd /Users/zoepaxinos/elios
git add src/app/components/sections/ src/app/hero.tsx
git commit -m "refactor: extract About, Menu and Catering sections from hero"
```

---

## Task 4: Create the `(site)` route group and layout

**Files:**
- Create: `src/app/(site)/layout.tsx`
- Move: `src/app/page.tsx` → `src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: `ContactSection` from Task 2.
- Produces: a layout wrapping every route under `(site)`.

- [ ] **Step 1: Create the layout**

```tsx
import { sanityFetch } from "@/sanity/live";
import { cafeInfoQuery, navigationQuery } from "@/sanity/queries";
import Nav from "../components/nav";
import Footer from "../components/footer";
import ContactSection from "../components/sections/contact-section";

/**
 * Chrome shared by every public page: nav, the contact block, and the footer.
 *
 * This is a route group — the (site) directory does not appear in URLs, so
 * (site)/about/page.tsx still serves /about. It exists so Nav, ContactSection
 * and Footer are declared once and cafeInfo is fetched once, rather than being
 * prop-drilled through four pages.
 *
 * /studio deliberately sits OUTSIDE this group: it renders its own <html> and
 * <body> and must not receive any of this chrome.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ data: cafeInfo }, { data: navigation }] = await Promise.all([
    sanityFetch({ query: cafeInfoQuery }),
    sanityFetch({ query: navigationQuery }),
  ]);

  return (
    <div className="min-h-screen bg-[#13322b] text-white">
      <Nav items={(navigation as { items?: { label: string; href: string }[] } | null)?.items} />
      <main>{children}</main>
      <ContactSection cafeInfo={cafeInfo} />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Move the home page into the group**

```bash
cd /Users/zoepaxinos/elios
mkdir -p "src/app/(site)"
git mv src/app/page.tsx "src/app/(site)/page.tsx"
```

Use `git mv` so the move is recorded as a rename rather than a delete plus an add.

Both `src/app/page.tsx` and `src/app/(site)/page.tsx` resolve to `/`. Leaving both in place is a route conflict and a build error — this must be a move, never a copy.

- [ ] **Step 3: Fix the moved page's relative imports**

`(site)/page.tsx` is one directory deeper. Any `./hero` becomes `../hero`; `./components/...` becomes `../components/...`. The `@/sanity/...` alias imports are unaffected.

Do not yet change what it fetches — Task 5 does that. It must simply compile and render as before.

- [ ] **Step 4: Remove `<Nav>` from `hero.tsx` — required, or the home page renders two navs**

`hero.tsx` currently renders its own nav at line 690:

```tsx
      <Nav items={navigation?.items} />
```

The `(site)` layout now renders Nav for every page. Delete that line, delete the `import Nav from "./components/nav";`, and delete the `navigation` prop from `Hero`'s signature and its prop type — nothing else in `Hero` uses it.

Verify:

```bash
cd /Users/zoepaxinos/elios
echo "Nav refs in hero.tsx (expect 0):"; grep -c '<Nav\|from "./components/nav"' src/app/hero.tsx
echo "navigation refs in hero.tsx (expect 0):"; grep -c 'navigation' src/app/hero.tsx
echo "nav elements served on / (expect 1):"; curl -s http://localhost:3000/ | grep -c '<nav'
```

Expected: `0`, `0`, `1`. A count of `2` for `<nav` means this step was skipped.

`(site)/page.tsx` still passes `navigation={navigation}` at this point and will now fail to typecheck — remove that prop from the call site too. Task 5 removes the query itself.

- [ ] **Step 4: Verify**

```bash
cd /Users/zoepaxinos/elios
echo "old home page gone (expect 'no'):"; [ -f src/app/page.tsx ] && echo yes || echo no
npx tsc --noEmit && echo "TSC_OK"
printf "/ -> "; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
printf "/studio -> "; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/studio
```

Expected: `no`, `TSC_OK`, `/ -> 200`, `/studio -> 200`.

- [ ] **Step 5: Verify the contact block now renders on the home page, and studio is untouched**

```bash
cd /Users/zoepaxinos/elios
echo "contact block on / (expect 1):"; curl -s http://localhost:3000/ | grep -c 'id="contact"'
echo "contact block on /studio (expect 0):"; curl -s http://localhost:3000/studio | grep -c 'id="contact"'
echo "nav on /studio (expect 0):"; curl -s http://localhost:3000/studio | grep -c 'z-\[10000\]'
```

Expected: `1`, `0`, `0`. Any chrome on `/studio` means the group boundary is wrong.

- [ ] **Step 6: Commit**

```bash
cd /Users/zoepaxinos/elios
git add "src/app/(site)/layout.tsx" "src/app/(site)/page.tsx" src/app/page.tsx
git commit -m "feat: add (site) route group with shared layout and contact block"
```

---

## Task 5: Build the four routes and retire the old pages

**Files:**
- Modify: `src/app/(site)/page.tsx`
- Create: `src/app/(site)/about/page.tsx`, `src/app/(site)/menu/page.tsx`, `src/app/(site)/catering/page.tsx`
- Delete: `src/app/about/page.tsx`, `src/app/menu/page.tsx`, `src/app/contact/page.tsx`, `src/app/components/page-layout.tsx`

**Interfaces:**
- Consumes: `AboutSection`, `MenuSection`, `CateringSection` (Task 3), `ReelsSection` (Task 2).
- Produces: no exports other than the four default page components.

- [ ] **Step 1: Trim the home page to hero + reels**

Rewrite `src/app/(site)/page.tsx`:

```tsx
import { sanityFetch } from "@/sanity/live";
import { instagramReelsQuery } from "@/sanity/queries";
import Hero from "../hero";
import ReelsSection from "../components/sections/reels-section";

export default async function Home() {
  const { data: instagramReels } = await sanityFetch({ query: instagramReelsQuery });

  const reels = instagramReels as { heading?: string; reels?: { url: string }[] } | null;

  return (
    <>
      <Hero />
      <ReelsSection heading={reels?.heading} reels={reels?.reels} />
    </>
  );
}
```

Three queries are deliberately gone from this page:

- `announcementQuery` — `announcement` was fetched, passed and typed but never rendered.
- `navigationQuery` — the `(site)` layout fetches it for Nav now (Task 4 Step 4 removed Nav from `Hero`).
- `cafeInfoQuery`, `menuQuery`, `menuPagesQuery`, `aboutSectionQuery` — those sections moved to their own routes.

`<Hero />` takes no props. After Tasks 3 and 4 its prop type should be empty; delete any parameters left over and remove the now-unused prop type entirely rather than leaving an empty interface.

- [ ] **Step 2: Create `(site)/about/page.tsx`**

```tsx
import { sanityFetch } from "@/sanity/live";
import { aboutSectionQuery } from "@/sanity/queries";
import AboutSection from "../../components/sections/about-section";
import AboutIntro from "./about-intro";

export default async function AboutPage() {
  const { data: aboutSection } = await sanityFetch({ query: aboutSectionQuery });

  return (
    <>
      <AboutIntro />
      <AboutSection aboutSection={aboutSection} />
    </>
  );
}
```

Then create `src/app/(site)/about/about-intro.tsx`: move the **entire body** of the existing `src/app/about/page.tsx` into it verbatim, renaming the component to `AboutIntro` and removing its `<PageLayout>` wrapper (the `(site)` layout supplies nav and footer now). Keep `"use client";` — it uses framer-motion.

This is the constraint that `/about` keeps its existing Pete/Elio content with `<AboutSection>` appended below.

- [ ] **Step 3: Create `(site)/menu/page.tsx`**

```tsx
import { sanityFetch } from "@/sanity/live";
import { menuQuery, menuPagesQuery } from "@/sanity/queries";
import MenuSection from "../../components/sections/menu-section";

export default async function MenuPage() {
  const [{ data: menu }, { data: menuPages }] = await Promise.all([
    sanityFetch({ query: menuQuery }),
    sanityFetch({ query: menuPagesQuery }),
  ]);

  return (
    <MenuSection
      menu={Array.isArray(menu) ? menu : []}
      menuPages={Array.isArray(menuPages) ? menuPages : []}
    />
  );
}
```

No `cafeInfoQuery` — the menu section does not reference `cafeInfo`.

- [ ] **Step 4: Create `(site)/catering/page.tsx`**

```tsx
import { sanityFetch } from "@/sanity/live";
import { cafeInfoQuery } from "@/sanity/queries";
import CateringSection from "../../components/sections/catering-section";

export default async function CateringPage() {
  const { data: cafeInfo } = await sanityFetch({ query: cafeInfoQuery });

  return <CateringSection cafeInfo={cafeInfo} />;
}
```

This route fetches `cafeInfoQuery` even though the layout also fetches it, because a layout cannot pass props to a page.

- [ ] **Step 5: Delete the superseded files**

```bash
cd /Users/zoepaxinos/elios
git rm src/app/about/page.tsx src/app/menu/page.tsx src/app/contact/page.tsx src/app/components/page-layout.tsx
```

Confirm nothing still imports `PageLayout`:

```bash
cd /Users/zoepaxinos/elios
grep -rn "page-layout\|PageLayout" src/ || echo "no references — good"
```

- [ ] **Step 6: Verify routes**

```bash
cd /Users/zoepaxinos/elios
npx tsc --noEmit && echo "TSC_OK"
for p in "" about menu catering studio; do
  printf "  /%s -> " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/$p"
done
printf "  /contact -> "; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/contact
```

Expected: `TSC_OK`; `200` for `/`, `/about`, `/menu`, `/catering`, `/studio`; **`404` for `/contact`**.

- [ ] **Step 7: Verify each page carries its own section and no others**

```bash
cd /Users/zoepaxinos/elios
for p in "" about menu catering; do
  html=$(curl -s "http://localhost:3000/$p")
  printf "  /%-9s about=%s menu=%s catering=%s contact=%s trail=%s\n" "$p" \
    "$(printf '%s' "$html" | grep -c 'id="about"')" \
    "$(printf '%s' "$html" | grep -c 'id="menu"')" \
    "$(printf '%s' "$html" | grep -c 'id="catering"')" \
    "$(printf '%s' "$html" | grep -c 'id="contact"')" \
    "$(printf '%s' "$html" | grep -c 'data-testid="image-trail"')"
done
```

Expected:

```
  /          about=0 menu=0 catering=0 contact=1 trail=1
  /about     about=1 menu=0 catering=0 contact=1 trail=0
  /menu      about=0 menu=1 catering=0 contact=1 trail=0
  /catering  about=0 menu=0 catering=1 contact=1 trail=0
```

`contact=1` everywhere is the point of the change. `trail=1` only on `/` confirms the hero did not leak into other routes.

- [ ] **Step 8: Production build**

```bash
cd /Users/zoepaxinos/elios
npx next build 2>&1 | tail -25
```

Expected: build succeeds and the route list shows `/`, `/about`, `/menu`, `/catering`, `/studio` — and **no** `/contact`.

- [ ] **Step 9: Commit**

```bash
cd /Users/zoepaxinos/elios
git add "src/app/(site)" src/app/about src/app/menu src/app/contact src/app/components/page-layout.tsx src/app/hero.tsx
git commit -m "feat: split About, Menu and Catering into separate routes"
```

---

## Task 6: Nav — path-based links and active state

**Files:**
- Modify: `src/app/components/nav.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Nav` unchanged in signature — `{ items?: { label: string; href: string }[] | null }`.

- [ ] **Step 1: Replace the default items**

Currently:

```tsx
const defaultNavItems = [
  { label: "About", href: "#about" },
  { label: "Menu", href: "#menu" },
  { label: "Catering", href: "#catering" },
  { label: "Contact", href: "#contact" },
];
```

Replace with:

```tsx
// Fallback when Sanity has no navigation document. Paths, not anchors —
// each section now lives on its own route. Contact is intentionally absent:
// the contact block renders at the bottom of every page.
const defaultNavItems = [
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Catering", href: "/catering" },
];
```

- [ ] **Step 2: Swap IntersectionObserver for `usePathname`**

Replace the whole `useEffect` scroll-spy block in `Nav` — the one building `ids`, `visible`, and an `IntersectionObserver` with `rootMargin: "-45% 0px -45% 0px"` — with:

```tsx
const pathname = usePathname();
```

and change the render to compare paths:

```tsx
<NavItem key={item.label} item={item} active={pathname === item.href} />
```

Add `import { usePathname } from "next/navigation";` and remove `useEffect`/`useState` from the React import **only if** nothing else in the file still uses them. `NavItem` uses both — check before deleting.

- [ ] **Step 3: Use `Link` for client-side navigation**

In `NavItem`, replace the `<a ref={ref} href={item.href} …>` element with `next/link`:

```tsx
import Link from "next/link";
```

```tsx
<Link ref={ref} href={item.href} className="…" style={{…}}>
```

Keep every class, style, child element and the `ref` exactly as they are — `NavItem` measures the element with a `ResizeObserver` to size its sketch circle, and that depends on the rendered box being unchanged.

- [ ] **Step 4: Verify**

```bash
cd /Users/zoepaxinos/elios
echo "anchors left in nav (expect 0):"; grep -c 'href: "#' src/app/components/nav.tsx
echo "IntersectionObserver left (expect 0):"; grep -c 'IntersectionObserver' src/app/components/nav.tsx
echo "usePathname present (expect 1):"; grep -c 'usePathname' src/app/components/nav.tsx
npx tsc --noEmit && echo "TSC_OK"
npx eslint src/app/components/nav.tsx && echo "LINT_OK"
```

Expected: `0`, `0`, `1`, `TSC_OK`, `LINT_OK`.

- [ ] **Step 5: Verify nav renders on every page**

```bash
cd /Users/zoepaxinos/elios
for p in "" about menu catering; do
  printf "  /%-9s nav links: " "$p"
  curl -s "http://localhost:3000/$p" | grep -oE 'href="/(about|menu|catering)"' | sort -u | tr '\n' ' '; echo
done
```

Expected: all three links present on all four pages. This is also the fix for the pre-existing bug where `/about` and `/menu` fell back to hardcoded anchors that resolved to nothing.

- [ ] **Step 6: Commit**

```bash
cd /Users/zoepaxinos/elios
git add src/app/components/nav.tsx
git commit -m "feat: nav uses routes and pathname-based active state"
```

---

## Task 7: Sanity content migration

**This task writes to the production dataset.** It is a content change, not a code change. Do **not** bundle it into a code commit, and do **not** run it without the human's explicit go-ahead at the time.

Until it runs, the nav falls back to `defaultNavItems` only when the Sanity document is empty — which it is not. So live nav will still serve `#about` etc. and be broken. Code and content must ship together.

**Files:**
- Modify: `src/sanity/schemas/navigation.ts` (field label only)

- [ ] **Step 1: Relabel the schema field**

In `src/sanity/schemas/navigation.ts`, change the `href` field's title from `"Link (anchor)"` to `"Link"`, and add a description so editors know the expected format:

```ts
defineField({
  name: "href",
  title: "Link",
  type: "string",
  description: "Path, e.g. /about",
  validation: (rule) => rule.required(),
}),
```

- [ ] **Step 2: Confirm current live data before writing**

```bash
cd /Users/zoepaxinos/elios
curl -s "https://xxmnl48n.api.sanity.io/v2023-05-03/data/query/production?query=$(python3 -c "import urllib.parse;print(urllib.parse.quote('*[_type==\"navigation\"][0]{_id,items}'))")" | python3 -m json.tool
```

Expected: four items with `_key` values `nav1`–`nav4` and hrefs `#about`, `#menu`, `#catering`, `#contact`. Record the `_id`.

- [ ] **Step 3: Ask the human to approve the write**

State exactly what will change: three `href` values rewritten to paths, and the Contact item removed. Wait for approval.

- [ ] **Step 4: Apply the migration**

Use the Sanity MCP `patch_documents` tool (or Studio by hand) to set:

- `items[_key=="nav1"].href` → `/about`
- `items[_key=="nav2"].href` → `/menu`
- `items[_key=="nav3"].href` → `/catering`

and remove the item with `_key == "nav4"` (Contact).

- [ ] **Step 5: Verify the migration**

```bash
cd /Users/zoepaxinos/elios
curl -s "https://xxmnl48n.api.sanity.io/v2023-05-03/data/query/production?query=$(python3 -c "import urllib.parse;print(urllib.parse.quote('*[_type==\"navigation\"][0].items[]{label,href}'))")" | python3 -m json.tool
```

Expected: exactly three items — About `/about`, Menu `/menu`, Catering `/catering`. No Contact, no `#`.

- [ ] **Step 6: Verify the live nav**

```bash
cd /Users/zoepaxinos/elios
curl -s http://localhost:3000/ | grep -oE 'href="[^"]*"' | grep -E '/(about|menu|catering)' | sort -u
echo "anchors left in served nav (expect 0):"; curl -s http://localhost:3000/ | grep -c 'href="#'
```

- [ ] **Step 7: Commit the schema change**

```bash
cd /Users/zoepaxinos/elios
git add src/sanity/schemas/navigation.ts
git commit -m "chore(sanity): relabel nav href field for paths"
```

---

## Definition of Done

- [ ] `npx tsc --noEmit` clean.
- [ ] `npx eslint src/app/components/` clean; `src/app/hero.tsx` at 21 problems or fewer.
- [ ] `npx next build` succeeds; route list shows `/`, `/about`, `/menu`, `/catering`, `/studio` and no `/contact`.
- [ ] `/contact` returns 404.
- [ ] Each page carries exactly its own section, per the Task 5 Step 7 matrix.
- [ ] Contact block present on all four site pages.
- [ ] Image trail present on `/` only.
- [ ] Nav shows three route links on every page and marks the current route active.
- [ ] `/studio` loads with no Nav, ContactSection or Footer.
- [ ] `hero.tsx` around 400 lines, with `mobileSpine` and `heroTrailItems` intact.
- [ ] Sanity navigation document holds three path-based items.
- [ ] Mobile hero visually unchanged at 390px.

## Out of Scope

- Per-page SEO metadata. Only the root layout defines title/description; every page shares one.
- Removing dead `Draggable`, `PhotoPolaroid`, `InteractivePolaroid`.
- The unused `cafeInfo` fields `menuHeading` and `cateringHeading`.
- Unused image assets accumulated earlier: `sticker-tomato-can.png`, `sticker-13.png`, `sticker-4.png`, `sticker-contactus-receipts.png`.
