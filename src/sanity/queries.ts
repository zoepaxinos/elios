import { groq } from "next-sanity";

export const cafeInfoQuery = groq`*[_type == "cafeInfo"][0]{
  name,
  tagline,
  about,
  address,
  phone,
  email,
  hours,
  instagram,
  heroImage,
  logo,
  menuHeading,
  cateringHeading,
  cateringText,
  contactHeading
}`;

export const menuQuery = groq`*[_type == "menuCategory"] | order(order asc) {
  _id,
  title,
  description,
  "items": *[_type == "menuItem" && references(^._id) && available != false] | order(name asc) {
    _id,
    name,
    description,
    price,
    image,
    dietary
  }
}`;

export const menuPagesQuery = groq`*[_type == "menuPage"] | order(order asc) {
  _id,
  title,
  image
}`;

export const announcementQuery = groq`*[_type == "announcement" && active == true][0]{
  text
}`;

export const navigationQuery = groq`*[_type == "navigation"][0]{
  items[]{
    label,
    href
  }
}`;

export const aboutSectionQuery = groq`*[_type == "aboutSection"][0]{
  heading,
  body,
  image
}`;
