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
