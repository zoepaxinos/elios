import { defineField, defineType } from "sanity";

export const aboutSection = defineType({
  name: "aboutSection",
  title: "About Section",
  type: "document",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "About Us",
    }),
    defineField({
      name: "body",
      title: "Body Text",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "image",
      title: "About Image (Polaroid graphic)",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare: () => ({ title: "About Section" }),
  },
});
