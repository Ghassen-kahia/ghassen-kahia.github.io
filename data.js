/* ==========================================================
   EDIT YOUR CONTENT HERE
   Everything on the site (text, projects, skills, experience,
   links) is driven from this file — no need to touch the HTML.
   ========================================================== */

const SITE = {
  name: "Ghassen Kahia",
  role: "Software Engineer",
  tagline:
    "I design and build software that feels considered — fast, clear, and engineered to last.",
  email: "kahiaghassen4@gmail.com",
  location: "Tunisia",
  timezone: "Africa/Tunis", // used for the live clock in the hero
  available: true, // false shows "Currently booked"
  resume: "#", // link to your CV PDF, e.g. "assets/cv.pdf"
  socials: {
    GitHub: "https://github.com/",
    LinkedIn: "https://www.linkedin.com/",
    X: "https://x.com/",
  },

  // Wrap words in *asterisks* to highlight them.
  about:
    "I'm a software engineer who treats every product like a *well-made machine*: every part has a purpose, every interface is *measured twice*, and the whole thing should feel effortless to use. I work across the stack — from *database schemas* to the last pixel.",

  specs: [
    ["Discipline", "Full-stack engineering"],
    ["Based in", "Tunisia · GMT+1"],
    ["Focus", "Web apps, APIs, UI craft"],
    ["Languages", "Arabic · French · English"],
    ["Currently", "Open to new roles"],
  ],
};

/*
  Projects — shown in the "Drawing index".
  - category: used by the filter buttons (add any you want)
  - image: optional path, e.g. "assets/projects/my-app.png".
           Without one, a unique 3D model is generated from the title.
  - featured: true adds a ★ marker
*/
const PROJECTS = [
  {
    title: "Nebula Dashboard",
    description:
      "Real-time analytics dashboard with live charts, role-based access and a fully customizable widget layout.",
    tags: ["React", "TypeScript", "WebSockets", "Tailwind"],
    category: "Web",
    year: "2026",
    image: "",
    live: "#",
    code: "#",
    featured: true,
  },
  {
    title: "Pulse Mobile",
    description:
      "Cross-platform fitness tracker with offline sync, streaks and smart workout suggestions.",
    tags: ["Flutter", "Firebase"],
    category: "Mobile",
    year: "2025",
    image: "",
    live: "#",
    code: "#",
  },
  {
    title: "Atlas API",
    description:
      "Scalable REST + GraphQL backend with auth, rate limiting, caching and full test coverage.",
    tags: ["Node.js", "PostgreSQL", "Redis", "Docker"],
    category: "Backend",
    year: "2025",
    image: "",
    live: "#",
    code: "#",
  },
  {
    title: "Vision Sort",
    description:
      "Image classification pipeline that sorts and tags photos automatically using a fine-tuned CNN.",
    tags: ["Python", "PyTorch", "FastAPI"],
    category: "AI / ML",
    year: "2024",
    image: "",
    live: "#",
    code: "#",
  },
  {
    title: "Loom Commerce",
    description:
      "Headless e-commerce storefront with blazing-fast pages, cart, checkout and an admin panel.",
    tags: ["Next.js", "Stripe", "Prisma"],
    category: "Web",
    year: "2024",
    image: "",
    live: "#",
    code: "#",
    featured: true,
  },
  {
    title: "Echo Chat",
    description:
      "End-to-end encrypted messaging app with group rooms, typing indicators and file sharing.",
    tags: ["React Native", "Socket.io"],
    category: "Mobile",
    year: "2023",
    image: "",
    live: "#",
    code: "#",
  },
];

/* Skills — shown as a "Bill of materials". level: 1 to 5 */
const SKILLS = [
  { name: "TypeScript", group: "Language", level: 5 },
  { name: "JavaScript", group: "Language", level: 5 },
  { name: "Python", group: "Language", level: 4 },
  { name: "React", group: "Frontend", level: 5 },
  { name: "Next.js", group: "Frontend", level: 4 },
  { name: "Flutter", group: "Mobile", level: 3 },
  { name: "Node.js", group: "Backend", level: 4 },
  { name: "PostgreSQL", group: "Data", level: 4 },
  { name: "MongoDB", group: "Data", level: 3 },
  { name: "Docker", group: "DevOps", level: 4 },
  { name: "AWS", group: "DevOps", level: 3 },
  { name: "Figma", group: "Design", level: 4 },
];

/* Experience — shown as a "Revision history", newest first */
const EXPERIENCE = [
  {
    period: "2025 — Present",
    role: "Full-Stack Developer",
    company: "Company Name",
    description:
      "Building and shipping product features end-to-end, from database design to polished UI.",
  },
  {
    period: "2024 — 2025",
    role: "Software Engineering Intern",
    company: "Another Company",
    description:
      "Worked on internal tools, improved performance of key pages and automated deployment workflows.",
  },
  {
    period: "2021 — 2025",
    role: "Engineering Degree",
    company: "Your University",
    description:
      "Computer science & software engineering. Focus on distributed systems and web technologies.",
  },
];
