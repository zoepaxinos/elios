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
  logo
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

export const announcementQuery = groq`*[_type == "announcement" && active == true][0]{
  text
}`;
