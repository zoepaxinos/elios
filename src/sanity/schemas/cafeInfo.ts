import { defineField, defineType } from "sanity";

export const cafeInfo = defineType({
  name: "cafeInfo",
  title: "Cafe Info",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Cafe Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      description: "A short description or motto",
    }),
    defineField({
      name: "about",
      title: "About",
      type: "text",
      description: "About the cafe — shown on the homepage or about section",
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "string",
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),
    defineField({
      name: "hours",
      title: "Opening Hours",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "days", title: "Days", type: "string" }),
            defineField({ name: "time", title: "Time", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "instagram",
      title: "Instagram URL",
      type: "url",
    }),
    defineField({
      name: "menuHeading",
      title: "Menu Section Heading",
      type: "string",
      initialValue: "Our Menu",
    }),
    defineField({
      name: "cateringHeading",
      title: "Catering Section Heading",
      type: "string",
      initialValue: "Catering",
    }),
    defineField({
      name: "cateringText",
      title: "Catering Text",
      type: "array",
      of: [{ type: "block" }],
      description: "Rich text content for the catering section",
    }),
    defineField({
      name: "contactHeading",
      title: "Contact Section Heading",
      type: "string",
      initialValue: "Contact",
    }),
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
    }),
  ],
  preview: {
    select: { title: "name" },
  },
});
