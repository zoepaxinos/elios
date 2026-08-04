# Multi-page Split — Design

**Date:** 2026-08-04
**Status:** Approved, ready for implementation planning
**Branch at time of writing:** `elios-menu-annotations`

## Summary

Split the single-page site into separate routes. Today `/` renders `hero.tsx` — a
1101-line component containing six stacked sections — while `/about`, `/menu` and
`/contact` exist as standalone routes with unrelated content and a nav that does not
work on them.

After this change: `/`, `/about`, `/menu` and `/catering` are real pages, contact
details appear at the bottom of every page, and `hero.tsx` owns only the hero.

## Goals

- One section per route, each fetching only the data it renders.
- Contact details visible at the bottom of every page.
- Nav works on every page (it currently does not — see "Bug fixed incidentally").
- `hero.tsx` reduced to the hero alone.

## Non-goals

- Per-page SEO metadata. Only the root layout defines title/description today; every
  page shares one. Worth fixing, but separate.
- Removing the dead `Draggable`, `PhotoPolaroid`, `InteractivePolaroid` components.
- Any visual redesign. Sections move; they do not change appearance.

## Decisions

Settled during brainstorming. Not open for reinterpretation during implementation.

| Question | Decision |
|---|---|
| Existing `/about` | **Keep** its Pete/Elio composition; append the home page's `#about` block below it |
| Existing `/menu` | **Replaced** by the home page's `#menu` section |
| Existing `/contact` | **Deleted** — no contact route |
| Contact details | Bottom of **every** page, above the footer |
| Contact nav item | **Removed** from nav and from Sanity |
| Home page | Hero + reels only |
| Catering | **New** route |
| Architecture | Extract each section into its own component file (approach A) |
| Nav links | Migrate Sanity hrefs from anchors to paths |

## Route map

```
src/app/(site)/layout.tsx          server — fetches cafeInfo + navigation once,
                                   renders Nav -> children -> ContactSection -> Footer
src/app/(site)/page.tsx            Hero + ReelsSection
src/app/(site)/about/page.tsx      existing About content + AboutSection appended
src/app/(site)/menu/page.tsx       MenuSection
src/app/(site)/catering/page.tsx   CateringSection            (new)
src/app/studio/[[...tool]]/        untouched, outside the group
```

`(site)` is a route group: it does not appear in URLs, so `/about` stays `/about`. It
exists so Nav, ContactSection and Footer are declared once and `cafeInfo` is fetched
once, rather than prop-drilled through four pages.

`/studio` sits outside the group. It renders its own `<html>`/`<body>` and must not
receive site chrome.

## File extraction

`hero.tsx` (1101 lines) splits as follows. Line ranges are current and will shift as
edits land — anchor on the section's `id` attribute, not the number.

| New file | Extracted from | Also moves |
|---|---|---|
| `components/sections/about-section.tsx` | `<section id="about">` (~793–839) | `AboutVideoPolaroid` |
| `components/sections/menu-section.tsx` | `<section id="menu">` (~840–878) | `MenuBook` |
| `components/sections/catering-section.tsx` | `<section id="catering">` (~879–992) | `CateringEnquiryForm` |
| `components/sections/contact-section.tsx` | `<section id="contact">` (~993–1101) | `Map` usage |
| `components/sections/reels-section.tsx` | `ReelsSection` (~583–608) | — |
| `components/sections/section-shell.tsx` | new | the shared background |
| `components/portable-text.tsx` | new | `withoutBlankBlocks`, `portableTextComponents` |

All section components are `"use client"` — they use framer-motion and local state.
Each route's `page.tsx` is a **server component** that fetches and passes data down,
following the pattern `src/app/page.tsx` already uses.

The three existing standalone pages are currently `"use client"` and therefore cannot
fetch server-side. They are replaced, not edited.

`hero.tsx` retains only the hero: image trail, logo, byline, mobile sticker spine.
Expected size after extraction: roughly 400 lines.

### Shared background

The `#13322b` + `url(/images/BG.jpg)` background is written inline **six times** in
`hero.tsx`. It becomes one `<SectionShell>` component. Exact current value, to be
preserved verbatim:

```
backgroundColor: "#13322b",
backgroundImage: "url(/images/BG.jpg)",
backgroundSize: "1200px auto",
backgroundRepeat: "repeat",
```

## Data fetching

Currently `src/app/page.tsx` runs seven `sanityFetch` calls and passes all results to
`Hero`. After the split:

Derived by mapping each top-level `<section>` range against the identifiers it
actually references:

| Route | Queries | Because |
|---|---|---|
| `(site)/layout.tsx` | `cafeInfoQuery`, `navigationQuery` | Nav and ContactSection, which the layout renders itself |
| `/` | `instagramReelsQuery` | `ReelsSection`; the hero itself needs no Sanity data |
| `/about` | `aboutSectionQuery` | `aboutSection.body` |
| `/menu` | `menuQuery`, `menuPagesQuery` | `MenuBook`; needs **no** `cafeInfo` |
| `/catering` | `cafeInfoQuery` | `cafeInfo.cateringText` |

**A layout cannot pass props to a page.** In the App Router, `layout.tsx` receives
`children` as an already-constructed element; there is no prop channel to the page
beneath it. `/catering` must therefore fetch `cafeInfoQuery` itself rather than
inherit the layout's copy. Whether `next-sanity`'s `defineLive` deduplicates the same
query issued twice in one request should be checked during implementation; if it does
not, the cost is one extra lightweight query on that route only.

### Section boundaries

Measured, not estimated. `<ReelsSection>` renders at line 876 — **outside** the menu
section's closing `</section>` at 873 — so it is a sibling and moves to the home page
independently of the menu content.

| Section | Lines | Identifiers referenced |
|---|---|---|
| hero (no id) | 683–792 | none |
| `#about` | 793–839 | `aboutSection` |
| `#menu` | 840–878 | `menu`, `menuPages` |
| `#catering` | 879–992 | `cafeInfo`, `cateringText` |
| `#contact` | 993–1102 | `addr`, `phone`, `email`, `igHandle`, `hoursRows` |

The `#catering` range also matches the bare word `menu`, but only inside prose copy
("Our catering menu features…"), not as a data reference. Do not carry `menuQuery`
into `/catering` on the strength of a grep.

### Further dead data

Beyond `announcementQuery`, the `cafeInfo` fields `menuHeading` and `cateringHeading`
are defined in the schema, selected by `cafeInfoQuery`, and referenced nowhere in
`hero.tsx`. They are out of scope to remove, but should not be treated as required
inputs when extracting the Menu and Catering sections.

`announcementQuery` is **dropped**. `announcement` is currently fetched, passed to
`Hero`, and typed — but never rendered. Verified: the only occurrences in `hero.tsx`
are the prop type and the destructure.

### Data-tracing caution

Section-to-data mapping cannot be read off the JSX alone. `hero.tsx` derives locals
near the top of the component — `addr`, `phone`, `email`, `igHandle`, `hoursRows` —
from `cafeInfo`, and the contact section uses those locals rather than `cafeInfo`
directly. A naive grep suggests the contact section needs no data, which is wrong.
Each extracted section must have its derived locals traced and moved with it.

## Nav

Three items after this change: About, Menu, Catering.

- Sanity hrefs migrate `#about` → `/about`, `#menu` → `/menu`, `#catering` → `/catering`.
- The Contact item is deleted from the navigation document.
- The schema field label changes from "Link (anchor)" to "Link".
- `Nav` replaces its IntersectionObserver scroll-spy with `usePathname()` comparison.
  With one section per route there are no longer multiple section IDs to observe.

### Sanity writes

Two writes to the **production** dataset:

1. Update three `href` values on the `navigation` document.
2. Delete the Contact item from that document's `items` array.

These are content changes, not code. They must be run as an explicit, separately
confirmed step — never bundled silently into a code commit. Until they run, the nav
will point at anchors that no longer resolve.

## Bug fixed incidentally

`PageLayout` renders `<Nav />` with no `items` prop, so `/about`, `/menu` and
`/contact` fall back to `defaultNavItems` — hardcoded anchors (`#about`, `#menu`, …).
Those IDs do not exist on those pages, so **the nav links currently do nothing there**.
Only the home page passes Sanity's items through.

The `(site)` layout passes `items` to `Nav` for every page, which fixes this.
`PageLayout` is retired.

## Deletions

- `src/app/contact/page.tsx` — no contact route.
- `src/app/menu/page.tsx` — superseded by the extracted `MenuSection`.
- `src/app/components/page-layout.tsx` — replaced by the `(site)` layout.
- `announcementQuery` usage in the home page.

`src/app/about/page.tsx` is **not** deleted — its content is retained and moves into
`(site)/about/page.tsx`, with `<AboutSection>` appended below it.

## Verification

- `npx tsc --noEmit` clean; `npx eslint` shows no new problems.
- `npx next build` succeeds.
- `/`, `/about`, `/menu`, `/catering`, `/studio` all return 200.
- `/contact` returns 404.
- Each page's HTML contains its own section and none of the others.
- Contact details present in the HTML of all four site pages.
- Nav renders three items on every page and marks the current route active.
- The image trail runs on `/` only; no `.content__img` on other routes.
- Mobile hero unchanged at 390px.
- `/studio` still loads and carries no Nav, ContactSection or Footer.

## Risks

**The largest single diff in this project so far.** It moves roughly 700 lines between
files, deletes three pages, adds a route group, and changes how every page fetches
data. The section extractions are mechanical but the data tracing is not.

**Nav is broken between code and content.** Once the code expects paths, the nav stays
broken until the Sanity writes run. Sequence them together.

**`/menu` loses its current standalone design.** Lower risk than About was — the two
overlap heavily, both rendering the same `menu-1`/`menu-2` spreads — but it is still a
deletion.
