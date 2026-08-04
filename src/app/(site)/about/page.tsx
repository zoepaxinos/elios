import { sanityFetch } from "@/sanity/live";
import { aboutSectionQuery } from "@/sanity/queries";
import AboutSection from "../../components/sections/about-section";

export default async function AboutPage() {
  const { data: aboutSection } = await sanityFetch({ query: aboutSectionQuery });

  return <AboutSection aboutSection={aboutSection} />;
}
