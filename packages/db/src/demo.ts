// Fictional demo accounts (PRD §25.3). The seed creates them; demo mode offers one-click sign-in as each.
export const DEMO_PASSWORD = "demo-password";
export const DEMO_DOMAIN = "@demo.test";

export const DEMO_PERSONAS = [
  { email: "student@demo.test", name: "Ada Okafor", role: "Student", shows: "Active quests, XP, verified skills and a portfolio" },
  { email: "newbie@demo.test", name: "Ben Carter", role: "New student", shows: "First-time onboarding and empty states" },
  { email: "owner@demo.test", name: "Olive Hart", role: "Company owner", shows: "Northwind Pumps: briefs in every state, applicants" },
  { email: "owner2@demo.test", name: "Kofi Mensah", role: "Company owner", shows: "Kestrel Analytics: paid data projects" },
  { email: "owner3@demo.test", name: "Rosa Lindqvist", role: "Company owner", shows: "Harbor Robotics: not verified yet, drafts only" },
  { email: "mentor@demo.test", name: "Mina Sato", role: "Mentor", shows: "Review queue, mentees, rubric scoring" },
  { email: "mentor2@demo.test", name: "Theo Brandt", role: "Mentor", shows: "A second assessor for Bronze skill evidence" },
  { email: "staff@demo.test", name: "Sam Rivera", role: "Program staff", shows: "Brief approvals and organization checks" },
] as const;
