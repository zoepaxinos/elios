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
