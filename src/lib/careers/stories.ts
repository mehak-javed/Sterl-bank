/*
 * Shared by the home page's "Meet our people" (a client component) and the Careers page (a server
 * component). It lives in a plain module because a server component that imports DATA from a
 * "use client" file gets a client reference, not the array itself.
 */

/** Unsplash's image CDN: crop to a portrait, around the face, at a sensible size. */
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=faces&w=900&h=1080&q=75`;

/**
 * The stories. Names, jobs and quotes are FICTIONAL (portfolio demo). The photos are free stock
 * photos from Unsplash (Unsplash License): the people in them are models, not Sterl staff, and the
 * page says so. The licence doesn't require a visible credit, so (Mehak's choice) none is shown;
 * each photographer is recorded here in `by` / `profile` instead.
 */
export const STORIES = [
  {
    name: "Kai Adeyemi",
    role: "Software engineer",
    title: "Kai changed careers through an engineering apprenticeship",
    quote:
      "I came to Sterl as an apprentice after ten years in retail. Now I ship code that customers rely on every day, and I still learn something new every week.",
    photo: {
      src: unsplash("photo-1560250097-0b93528c311a"),
      alt: "A man in a dark suit standing beside a wall",
      by: "LinkedIn Sales Solutions",
      profile: "https://unsplash.com/@linkedinsalesnavigator",
    },
  },
  {
    name: "Mira Kowalski",
    role: "Credit risk analyst",
    title: "Mira makes family time and a growing career fit together",
    quote:
      "Flexible hours mean I can do the school run and still be on the risk dashboards when it matters. Nobody here asks me to choose.",
    photo: {
      src: unsplash("photo-1733348137613-90f1af8674fd"),
      alt: "A woman with red hair and glasses sitting in a chair",
      by: "Gruescu Ovidiu",
      profile: "https://unsplash.com/@ovidiugruescu",
    },
  },
  {
    name: "Theo Nakamura",
    role: "Product designer",
    title: "Theo finished a degree while growing at work",
    quote:
      "Sterl paid for my evening course and gave me real projects to practise on. Graduating felt like a win for the whole team.",
    photo: {
      src: unsplash("photo-1663386922276-9f9cf6094c92"),
      alt: "A man in a suit",
      by: "Zachary Delorenzo",
      profile: "https://unsplash.com/@zdelo",
    },
  },
  {
    name: "Amara Osei",
    role: "Customer success lead",
    title: "Amara went from the help line to leading the team",
    quote:
      "I started by answering customers' questions. Now I lead the team that makes sure every customer gets a real answer, quickly.",
    photo: {
      src: unsplash("photo-1780733057947-7b57f5108f68"),
      alt: "A woman with glasses and a suit sitting in a wicker chair",
      by: "Md Ishak Rahman",
      profile: "https://unsplash.com/@mdishakrahman",
    },
  },
];
