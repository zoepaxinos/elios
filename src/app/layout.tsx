import type { Metadata } from "next";
import { Cormorant_Garamond, Karla, Overpass, Caveat, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SanityLive } from "@/sanity/live";
import { DisableDraftMode } from "./components/disable-draft-mode";
import MotionProvider from "./components/motion-provider";
import { sanityFetch } from "@/sanity/live";
import { seoSettingsQuery } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import "./globals.css";

const SITE_URL = "https://elioscoburg.com.au";

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

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// IBM Plex Mono has no variable axis — each weight is a separate file, so keep the list tight.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await sanityFetch({ query: seoSettingsQuery });
  const seo = data as {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: any;
  } | null;

  const title = seo?.metaTitle || "Elio's Panino Italiano";
  const description =
    seo?.metaDescription ||
    "Authentic panini, focaccia and proper Italian coffee in Coburg North, Melbourne.";
  const ogImage = seo?.ogImage
    ? urlFor(seo.ogImage).width(1200).height(630).fit("crop").url()
    : "/og-default.png";

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Elio's Panino Italiano",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${karla.variable} ${overpass.variable} ${caveat.variable} ${workSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#13322b] text-espresso font-body">
        <MotionProvider>{children}</MotionProvider>
        <SanityLive />
        {isDraftMode && (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        )}
      </body>
    </html>
  );
}
