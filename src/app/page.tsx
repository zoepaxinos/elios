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
      menu={Array.isArray(menu) ? menu : []}
      menuPages={Array.isArray(menuPages) ? menuPages : []}
      announcement={announcement}
      navigation={navigation}
      aboutSection={aboutSection}
    />
  );
}
