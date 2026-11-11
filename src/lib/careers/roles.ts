/** Sterl's open roles (fictional company). `slug` is the address of the role's application page. */
export const ROLES = [
  { slug: "software-engineer-java", title: "Software Engineer, Java", team: "Engineering", place: "Glasgow, hybrid", type: "Full time" },
  { slug: "front-end-engineer-react", title: "Front-end Engineer, React", team: "Engineering", place: "London, hybrid", type: "Full time" },
  { slug: "credit-risk-analyst", title: "Credit Risk Analyst", team: "Credit risk", place: "Glasgow, hybrid", type: "Full time" },
  { slug: "product-designer", title: "Product Designer", team: "Design", place: "Remote, UK", type: "Full time" },
  {
    slug: "degree-apprentice-software-engineering",
    title: "Degree Apprentice, Software Engineering",
    team: "Engineering",
    place: "Glasgow",
    type: "Apprenticeship",
  },
  { slug: "general", title: "Open application", team: "Any team", place: "UK", type: "Any" },
] as const;

export type Role = (typeof ROLES)[number];

export function findRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}
