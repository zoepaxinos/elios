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
