import { sanityFetch } from "@/sanity/live";
import { cafeInfoQuery } from "@/sanity/queries";
import CateringSection from "../../components/sections/catering-section";

export default async function CateringPage() {
  const { data: cafeInfo } = await sanityFetch({ query: cafeInfoQuery });

  return <CateringSection cafeInfo={cafeInfo} />;
}
