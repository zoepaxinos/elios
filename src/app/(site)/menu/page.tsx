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
