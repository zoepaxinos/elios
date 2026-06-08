# Sanity CMS Integration + Visual Editing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect all editable content (nav, about, menu, catering, contact) to Sanity CMS and enable visual editing via the Presentation Tool.

**Architecture:** Server component (`page.tsx`) fetches all content from Sanity and passes it as props to the client component (`hero.tsx`). Visual editing uses `defineLive` for real-time updates, Draft Mode for preview, and `<VisualEditing />` for click-to-edit overlays. Sanity Studio is already embedded at `/studio`.

**Tech Stack:** Next.js 16, Sanity v5.26, next-sanity v12.4, @portabletext/react

---

### Task 1: Create new Sanity schemas

**Files:**
- Create: `src/sanity/schemas/navigation.ts`
- Create: `src/sanity/schemas/aboutSection.ts`
- Create: `src/sanity/schemas/menuPage.ts`
- Modify: `src/sanity/schemas/cafeInfo.ts`
- Modify: `src/sanity/schemas/index.ts`

- [ ] **Step 1: Create `navigation` schema**

```typescript
// src/sanity/schemas/navigation.ts
import { defineField, defineType } from "sanity";

export const navigation = defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  fields: [
    defineField({
      name: "items",
      title: "Nav Items",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "href", title: "Link (anchor)", type: "string", validation: (rule) => rule.required() }),
          ],
          preview: {
            select: { title: "label", subtitle: "href" },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site Navigation" }),
  },
});
```

- [ ] **Step 2: Create `aboutSection` schema**

```typescript
// src/sanity/schemas/aboutSection.ts
import { defineField, defineType } from "sanity";

export const aboutSection = defineType({
  name: "aboutSection",
  title: "About Section",
  type: "document",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "About Us",
    }),
    defineField({
      name: "body",
      title: "Body Text",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "image",
      title: "About Image (Polaroid graphic)",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare: () => ({ title: "About Section" }),
  },
});
```

- [ ] **Step 3: Create `menuPage` schema**

```typescript
// src/sanity/schemas/menuPage.ts
import { defineField, defineType } from "sanity";

export const menuPage = defineType({
  name: "menuPage",
  title: "Menu Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Menu Page Image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first",
    }),
  ],
  orderings: [
    { title: "Display Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", media: "image" },
  },
});
```

- [ ] **Step 4: Update `cafeInfo` schema — add catering and section heading fields**

Add these fields to the existing `cafeInfo.ts` after the `instagram` field:

```typescript
defineField({
  name: "menuHeading",
  title: "Menu Section Heading",
  type: "string",
  initialValue: "Our Menu",
}),
defineField({
  name: "cateringHeading",
  title: "Catering Section Heading",
  type: "string",
  initialValue: "Catering",
}),
defineField({
  name: "cateringText",
  title: "Catering Text",
  type: "array",
  of: [{ type: "block" }],
  description: "Rich text content for the catering section",
}),
defineField({
  name: "contactHeading",
  title: "Contact Section Heading",
  type: "string",
  initialValue: "Contact",
}),
```

- [ ] **Step 5: Update schema index**

```typescript
// src/sanity/schemas/index.ts
import { cafeInfo } from "./cafeInfo";
import { menuCategory } from "./menuCategory";
import { menuItem } from "./menuItem";
import { menuPage } from "./menuPage";
import { announcement } from "./announcement";
import { navigation } from "./navigation";
import { aboutSection } from "./aboutSection";

export const schemaTypes = [cafeInfo, menuCategory, menuItem, menuPage, announcement, navigation, aboutSection];
```

- [ ] **Step 6: Verify schemas load in Studio**

Run: `npm run dev` and visit `http://localhost:3001/studio`

Expected: New document types (Navigation, About Section, Menu Page) appear in the Studio sidebar alongside existing types.

- [ ] **Step 7: Commit**

```bash
git add src/sanity/schemas/
git commit -m "feat: add navigation, aboutSection, menuPage schemas and update cafeInfo"
```

---

### Task 2: Update Sanity queries

**Files:**
- Modify: `src/sanity/queries.ts`

- [ ] **Step 1: Add new queries**

Replace the contents of `src/sanity/queries.ts`:

```typescript
import { groq } from "next-sanity";

export const cafeInfoQuery = groq`*[_type == "cafeInfo"][0]{
  name,
  tagline,
  about,
  address,
  phone,
  email,
  hours,
  instagram,
  heroImage,
  logo,
  menuHeading,
  cateringHeading,
  cateringText,
  contactHeading
}`;

export const menuQuery = groq`*[_type == "menuCategory"] | order(order asc) {
  _id,
  title,
  description,
  "items": *[_type == "menuItem" && references(^._id) && available != false] | order(name asc) {
    _id,
    name,
    description,
    price,
    image,
    dietary
  }
}`;

export const menuPagesQuery = groq`*[_type == "menuPage"] | order(order asc) {
  _id,
  title,
  image
}`;

export const announcementQuery = groq`*[_type == "announcement" && active == true][0]{
  text
}`;

export const navigationQuery = groq`*[_type == "navigation"][0]{
  items[]{
    label,
    href
  }
}`;

export const aboutSectionQuery = groq`*[_type == "aboutSection"][0]{
  heading,
  body,
  image
}`;
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/queries.ts
git commit -m "feat: add queries for navigation, aboutSection, menuPages"
```

---

### Task 3: Set up Sanity client for visual editing

**Files:**
- Modify: `src/sanity/client.ts`
- Create: `src/sanity/live.ts`

- [ ] **Step 1: Update client with stega support**

```typescript
// src/sanity/client.ts
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  stega: {
    studioUrl: "/studio",
  },
});
```

- [ ] **Step 2: Create live.ts**

```typescript
// src/sanity/live.ts
import { defineLive } from "next-sanity/live";
import { client } from "./client";

export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({ apiVersion: "2026-02-01" }),
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
});
```

- [ ] **Step 3: Add SANITY_API_READ_TOKEN to .env.local**

You need to create an API token in your Sanity project settings (sanity.io/manage → API → Tokens → Add token with Viewer permissions). Add it to `.env.local`:

```
SANITY_API_READ_TOKEN=your-viewer-token-here
```

- [ ] **Step 4: Commit**

```bash
git add src/sanity/client.ts src/sanity/live.ts
git commit -m "feat: set up Sanity client with stega and defineLive"
```

---

### Task 4: Set up Draft Mode and Visual Editing

**Files:**
- Create: `src/app/api/draft-mode/enable/route.ts`
- Create: `src/app/api/draft-mode/disable/route.ts`
- Create: `src/app/components/disable-draft-mode.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create Draft Mode enable route**

```typescript
// src/app/api/draft-mode/enable/route.ts
import { client } from "@/sanity/client";
import { defineEnableDraftMode } from "next-sanity/draft-mode";

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({
    token: process.env.SANITY_API_READ_TOKEN || "",
  }),
});
```

- [ ] **Step 2: Create Draft Mode disable route**

```typescript
// src/app/api/draft-mode/disable/route.ts
import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"));
}
```

- [ ] **Step 3: Create DisableDraftMode component**

```typescript
// src/app/components/disable-draft-mode.tsx
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
```

- [ ] **Step 4: Update layout.tsx**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Karla, Overpass, Caveat } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SanityLive } from "@/sanity/live";
import { DisableDraftMode } from "./components/disable-draft-mode";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
  weight: ["300"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elio's Cafe",
  description: "Welcome to Elio's — Coburg",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${karla.variable} ${overpass.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#13322b] text-espresso font-body">
        {children}
        <SanityLive />
        {(await draftMode()).isEnabled && (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        )}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/draft-mode/ src/app/components/disable-draft-mode.tsx src/app/layout.tsx
git commit -m "feat: add Draft Mode routes, VisualEditing, and SanityLive"
```

---

### Task 5: Configure Presentation Tool in Sanity Studio

**Files:**
- Modify: `sanity.config.ts`
- Create: `src/sanity/presentation/resolve.ts`

- [ ] **Step 1: Create document location resolver**

```typescript
// src/sanity/presentation/resolve.ts
import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";

export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    cafeInfo: defineLocations({
      select: { title: "name" },
      resolve: () => ({
        locations: [
          { title: "Contact", href: "/#contact" },
          { title: "Catering", href: "/#catering" },
          { title: "Home", href: "/" },
        ],
      }),
    }),
    aboutSection: defineLocations({
      select: { title: "heading" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "About", href: "/#about" }],
      }),
    }),
    navigation: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: "Navigation", href: "/" }],
      }),
    }),
    menuPage: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Menu", href: "/#menu" }],
      }),
    }),
    menuCategory: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Menu", href: "/#menu" }],
      }),
    }),
    menuItem: defineLocations({
      select: { title: "name" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Menu Item", href: "/#menu" }],
      }),
    }),
    announcement: defineLocations({
      select: { title: "text" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Announcement", href: "/" }],
      }),
    }),
  },
};
```

- [ ] **Step 2: Update sanity.config.ts**

```typescript
// sanity.config.ts
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemas";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { resolve } from "./src/sanity/presentation/resolve";

export default defineConfig({
  name: "elios",
  title: "Elio's Cafe",
  projectId,
  dataset,
  plugins: [
    structureTool(),
    presentationTool({
      resolve,
      previewUrl: {
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: {
    types: schemaTypes,
  },
});
```

- [ ] **Step 3: Add CORS origin**

Run: `npx sanity cors add http://localhost:3001 --credentials`

- [ ] **Step 4: Commit**

```bash
git add sanity.config.ts src/sanity/presentation/
git commit -m "feat: configure Presentation Tool with document location resolver"
```

---

### Task 6: Install @portabletext/react

**Files:** None (dependency only)

- [ ] **Step 1: Install**

Run: `npm install @portabletext/react`

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @portabletext/react for rich text rendering"
```

---

### Task 7: Update page.tsx to fetch from Sanity

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx with Sanity data fetching**

```typescript
// src/app/page.tsx
import { sanityFetch } from "@/sanity/live";
import {
  cafeInfoQuery,
  menuQuery,
  menuPagesQuery,
  announcementQuery,
  navigationQuery,
  aboutSectionQuery,
} from "@/sanity/queries";
import Hero from "./hero";

export default async function Home() {
  const [
    { data: cafeInfo },
    { data: menu },
    { data: menuPages },
    { data: announcement },
    { data: navigation },
    { data: aboutSection },
  ] = await Promise.all([
    sanityFetch({ query: cafeInfoQuery }),
    sanityFetch({ query: menuQuery }),
    sanityFetch({ query: menuPagesQuery }),
    sanityFetch({ query: announcementQuery }),
    sanityFetch({ query: navigationQuery }),
    sanityFetch({ query: aboutSectionQuery }),
  ]);

  return (
    <Hero
      cafeInfo={cafeInfo}
      menu={menu ?? []}
      menuPages={menuPages ?? []}
      announcement={announcement}
      navigation={navigation}
      aboutSection={aboutSection}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: fetch all content from Sanity in page.tsx"
```

---

### Task 8: Update hero.tsx to accept Sanity data as props

**Files:**
- Modify: `src/app/hero.tsx`
- Modify: `src/app/components/nav.tsx`

This is the largest task. The hero component needs to:
1. Accept props for all editable content
2. Replace hardcoded nav items with Sanity data (with fallback)
3. Replace hardcoded about image/text with Sanity data (with fallback)
4. Replace hardcoded menu page images with Sanity menu pages (with fallback)
5. Replace hardcoded catering text with Sanity rich text (with fallback)
6. Replace hardcoded contact info with Sanity data (with fallback)
7. Replace hardcoded section headings with Sanity data (with fallback)

- [ ] **Step 1: Update Nav component to accept props**

```typescript
// src/app/components/nav.tsx
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
```

- [ ] **Step 2: Add types and props interface to hero.tsx**

Add this near the top of `hero.tsx`, after the imports:

```typescript
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/sanity/image";

type HeroProps = {
  cafeInfo: any;
  menu: any[];
  menuPages: any[];
  announcement: any;
  navigation: any;
  aboutSection: any;
};
```

Update the Hero function signature:

```typescript
export default function Hero({ cafeInfo, menu, menuPages, announcement, navigation, aboutSection }: HeroProps) {
```

- [ ] **Step 3: Update Nav usage in hero.tsx**

Replace:
```tsx
<Nav />
```
With:
```tsx
<Nav items={navigation?.items} />
```

- [ ] **Step 4: Update About section to use Sanity data**

Replace the hardcoded about image with:
```tsx
{aboutSection?.image ? (
  <Image src={urlFor(aboutSection.image).width(900).height(800).url()} alt={aboutSection.heading || "About"} width={900} height={800} className="w-full h-auto" />
) : (
  <Image src="/images/aboutus-graphic.png" alt="Meet Elio and I'm Pete" width={900} height={800} className="w-full h-auto" />
)}
```

Replace the hardcoded "About Us" heading with:
```tsx
{aboutSection?.heading || "About Us"}
```

Replace the hardcoded body text with:
```tsx
{aboutSection?.body ? (
  <PortableText value={aboutSection.body} />
) : (
  <>Elio&apos;s started with a simple idea: bring the kind of food you&apos;d actually eat in Italy, proper paninis, real focaccia, coffee that takes itself seriously without taking itself too seriously, to the corner of Newlands Road in <em className="italic">Coburg North.</em></>
)}
```

- [ ] **Step 5: Update Menu section to use Sanity menu pages**

In the `MenuBook` component, replace the hardcoded `menuPages` array:
```tsx
const menuPageUrls = menuPages && menuPages.length > 0
  ? menuPages.map((p: any) => urlFor(p.image).width(1546).height(1092).url())
  : ["/images/menu-2.png", "/images/menu-1.png"];
```

Replace the hardcoded "Our Menu" heading:
```tsx
{cafeInfo?.menuHeading || "Our Menu"}
```

- [ ] **Step 6: Update Catering section to use Sanity data**

Replace the hardcoded "Catering" heading:
```tsx
{cafeInfo?.cateringHeading || "Catering"}
```

Replace the hardcoded catering body text:
```tsx
{cafeInfo?.cateringText ? (
  <div className="text-base sm:text-lg md:text-[24px] leading-[0.95] text-[#FFFFDC]" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>
    <PortableText value={cafeInfo.cateringText} />
  </div>
) : (
  <>
    <p className="text-base sm:text-lg md:text-[24px] leading-[0.95] text-[#FFFFDC] mb-8" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "-0.04em" }}>
      From office lunches to private events, we bring Elio&apos;s to you...
    </p>
  </>
)}
```

- [ ] **Step 7: Update Contact section to use Sanity data**

Replace the hardcoded "Contact" heading:
```tsx
{cafeInfo?.contactHeading || "Contact"}
```

Replace hardcoded address/phone/email/hours with:
```tsx
<div>
  <p className="text-[#FFFFDC] text-lg leading-relaxed">{cafeInfo?.address || "70 Newlands Road"}</p>
  <p className="text-[#FFFFDC] text-lg leading-relaxed">Coburg North, 3058</p>
  <p className="text-[#FFFFDC] text-lg leading-relaxed">Melbourne</p>
</div>
<div>
  <p className="text-[#FFFFDC] text-lg leading-relaxed">{cafeInfo?.instagram || "elios.coburg"}</p>
  <p className="text-[#FFFFDC] text-lg leading-relaxed">{cafeInfo?.phone || "(03) 9191 0107"}</p>
  <p className="text-[#FFFFDC] text-lg leading-relaxed">{cafeInfo?.email || "info@elioscoburg.com"}</p>
</div>
<div>
  {cafeInfo?.hours && cafeInfo.hours.length > 0 ? (
    cafeInfo.hours.map((h: any, i: number) => (
      <p key={i} className="text-[#FFFFDC] text-lg leading-relaxed">{h.days} {h.time}</p>
    ))
  ) : (
    <>
      <p className="text-[#FFFFDC] text-lg leading-relaxed">Monday – Friday 7am – 2:30pm</p>
      <p className="text-[#FFFFDC] text-lg leading-relaxed">Saturday 8am – 2:30pm</p>
      <p className="text-[#FFFFDC] text-lg leading-relaxed">Sunday 9am – 2:30pm</p>
    </>
  )}
</div>
```

- [ ] **Step 8: Verify the site renders with fallback data**

Run: `npm run dev` and visit `http://localhost:3001`

Expected: Site renders exactly as before using fallback values (since no Sanity content exists yet).

- [ ] **Step 9: Commit**

```bash
git add src/app/hero.tsx src/app/components/nav.tsx
git commit -m "feat: connect hero sections to Sanity data with fallbacks"
```

---

### Task 9: Seed Sanity with initial content

- [ ] **Step 1: Open Sanity Studio at `http://localhost:3001/studio`**

- [ ] **Step 2: Create a Navigation document**

Add items:
- Label: "About", Href: "#about"
- Label: "Menu", Href: "#menu"
- Label: "Catering", Href: "#catering"
- Label: "Contact", Href: "#contact"

- [ ] **Step 3: Create a Cafe Info document**

Fill in: name, address, phone, email, hours, instagram, menuHeading, cateringHeading, cateringText, contactHeading.

- [ ] **Step 4: Create an About Section document**

Upload the `aboutus-graphic.png` image, set heading to "About Us", add body text.

- [ ] **Step 5: Create Menu Page documents**

Upload the two menu page images (menu-1.png, menu-2.png) with order 1 and 2.

- [ ] **Step 6: Verify live data renders on the site**

Visit `http://localhost:3001` — content should now come from Sanity.

---

### Task 10: Test Visual Editing

- [ ] **Step 1: Open Sanity Studio at `http://localhost:3001/studio`**

- [ ] **Step 2: Click "Presentation" in the Studio sidebar**

Expected: The site loads in an iframe inside the Studio.

- [ ] **Step 3: Click on editable text (e.g. "About Us" heading)**

Expected: Studio navigates to the About Section document with the heading field focused.

- [ ] **Step 4: Edit the heading text**

Expected: The change appears live in the iframe preview.

- [ ] **Step 5: Publish the change**

Expected: The live site at `http://localhost:3001` reflects the published change.
