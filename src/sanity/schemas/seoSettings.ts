import { defineField, defineType } from "sanity";

export const seoSettings = defineType({
  name: "seoSettings",
  title: "SEO / Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      description:
        "Shown in the browser tab and as the headline in search results / link previews. ~50–60 characters.",
      type: "string",
      validation: (rule) => rule.max(70).warning("Keep under ~60 characters for best results."),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      description:
        "The summary shown under the title in search results and link previews. ~150–160 characters.",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(200).warning("Keep under ~160 characters for best results."),
    }),
    defineField({
      name: "ogImage",
      title: "Social Share Image",
      description:
        "Optional. The image shown when the site is shared (Instagram, Messages, Facebook, etc.). Recommended 1200×630. Leave empty to use the default Elio's logo card.",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare: () => ({ title: "SEO / Site Settings" }),
  },
});
