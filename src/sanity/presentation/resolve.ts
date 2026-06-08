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
