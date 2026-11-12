/** One open role: the summary shown in lists, and the details shown on its job page. */
export type Role = {
  /** The role's address: /careers/jobs/[slug] (details) and /careers/apply/[slug] (the form). */
  slug: string;
  title: string;
  team: string;
  place: string;
  type: string;
  salary: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
};

/** Sterl's open roles. */
export const ROLES: Role[] = [
  {
    slug: "software-engineer-java",
    title: "Software Engineer, Java",
    team: "Engineering",
    place: "Glasgow, hybrid",
    type: "Full time",
    salary: "£55,000 – £70,000",
    summary:
      "Build the services that move customers' money: the ledger, payments and the APIs behind the Sterl app, with safety and correctness first.",
    responsibilities: [
      "Design, build and run Java and Spring Boot services over PostgreSQL",
      "Write tests that prove money moves exactly once, even under load",
      "Review code, pair with teammates and keep our services secure",
      "Take part in a fair, well-supported on-call rota",
    ],
    requirements: [
      "Solid experience with Java and Spring (Boot, Security or Data)",
      "Confidence with SQL and relational databases",
      "Experience writing automated tests and working with CI/CD",
      "Clear written and spoken communication",
    ],
    niceToHave: ["Financial services or payments experience", "Experience with cloud platforms such as AWS"],
  },
  {
    slug: "front-end-engineer-react",
    title: "Front-end Engineer, React",
    team: "Engineering",
    place: "London, hybrid",
    type: "Full time",
    salary: "£55,000 – £72,000",
    summary:
      "Craft the screens customers use every day: fast, accessible and calm, in React and Next.js, backed by careful tests.",
    responsibilities: [
      "Build features in React, Next.js and TypeScript",
      "Make every screen accessible and fast on any phone",
      "Work closely with design and back-end engineers",
      "Write component and end-to-end tests",
    ],
    requirements: [
      "Strong React and TypeScript experience",
      "A good eye for detail and accessibility (WCAG)",
      "Experience testing UIs (React Testing Library, Playwright or similar)",
    ],
    niceToHave: ["Next.js App Router experience", "Experience with design systems"],
  },
  {
    slug: "credit-risk-analyst",
    title: "Credit Risk Analyst",
    team: "Credit risk",
    place: "Glasgow, hybrid",
    type: "Full time",
    salary: "£45,000 – £58,000",
    summary:
      "Keep lending safe: monitor exposure and limits across our business borrowers, spot early warning signs and help decide what to do.",
    responsibilities: [
      "Monitor exposure, limit use and breaches across the lending book",
      "Review counterparties after rating changes or warning signs",
      "Build clear reports on concentration by sector and rating",
      "Work with engineers to improve our risk tools",
    ],
    requirements: [
      "A degree in a numerate subject, or equivalent experience",
      "Good knowledge of credit risk concepts",
      "Confidence with data: Excel and ideally SQL",
    ],
    niceToHave: ["Experience in corporate or commercial lending", "Python for analysis"],
  },
  {
    slug: "product-designer",
    title: "Product Designer",
    team: "Design",
    place: "Remote, UK",
    type: "Full time",
    salary: "£50,000 – £65,000",
    summary: "Shape how people see and manage their money, from first sign-up to everyday payments.",
    responsibilities: [
      "Design end-to-end journeys, from research to polished screens",
      "Test ideas with customers and learn from what they do",
      "Grow and look after our design system",
    ],
    requirements: [
      "Examples of your product design work and your process",
      "Strong skills in Figma or similar tools",
      "Understanding of accessible design",
    ],
    niceToHave: ["Experience designing for finance", "Prototyping in code"],
  },
  {
    slug: "degree-apprentice-software-engineering",
    title: "Degree Apprentice, Software Engineering",
    team: "Engineering",
    place: "Glasgow",
    type: "Apprenticeship",
    salary: "£24,000, with your degree paid for",
    summary:
      "Earn a computer science degree while working on real software with a mentor at your side. No experience needed, just curiosity.",
    responsibilities: [
      "Study for a BSc in Software Engineering, with fees paid by Sterl",
      "Spend four days a week building real features with your team",
      "Learn testing, code review and how a bank keeps money safe",
    ],
    requirements: [
      "Two A-levels or Highers (or equivalent), or relevant experience",
      "A genuine interest in technology and problem solving",
      "The right to work in the UK",
    ],
    niceToHave: ["Something you've built or tinkered with, however small"],
  },
];

export function findRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}
