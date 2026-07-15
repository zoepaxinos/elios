import { defineArrayMember, defineField, defineType } from "sanity";

export const instagramReels = defineType({
  name: "instagramReels",
  title: "Instagram Reels",
  type: "document",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      description: "Small label shown above the reels (e.g. \"Follow along\").",
      initialValue: "Follow along",
    }),
    defineField({
      name: "reels",
      title: "Reels",
      description:
        "Paste the URL of each Instagram reel to feature (e.g. https://www.instagram.com/reel/ABC123/). Reorder by dragging.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "reel",
          title: "Reel",
          fields: [
            defineField({
              name: "url",
              title: "Reel URL",
              type: "url",
              validation: (rule) =>
                rule
                  .required()
                  .uri({ scheme: ["https"] })
                  .custom((value) =>
                    !value || /instagram\.com\/(reel|reels|p|tv)\//.test(value)
                      ? true
                      : "Must be an Instagram reel or post URL",
                  ),
            }),
          ],
          preview: {
            select: { title: "url" },
            prepare: ({ title }) => ({ title: title || "Reel" }),
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Instagram Reels" }),
  },
});
