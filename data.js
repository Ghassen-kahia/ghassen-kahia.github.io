/* ==========================================================
   EDIT YOUR CONTENT HERE
   Everything on the site (text, projects, skills, experience,
   links) is driven from this file — no need to touch the HTML.
   ========================================================== */

const SITE = {
  name: "Ghassen Kahia",
  role: "Cloud & DevOps Engineer",
  tagline:
    "Engineering student building automated, secure infrastructure — from Terraform to Kubernetes. Looking for a final-year internship (PFE) from February 2027.",
  email: "kahiaghassen4@gmail.com",
  location: "Dijon, France",
  timezone: "Europe/Paris", // used for the live clock in the hero
  available: true,
  status: "Open to PFE · Feb 2027", // shown when available is true
  resume: "assets/Ghassen_Kahia_CV.pdf",
  photo: "assets/me.jpg",
  socials: {
    GitHub: "https://github.com/Ghassen-kahia",
    LinkedIn: "", // paste your LinkedIn profile URL here
  },

  // Wrap words in *asterisks* to highlight them.
  about:
    "I'm a cloud computing engineering student at ESPRIT, currently on exchange at ESEO France. I like infrastructure that runs itself — *automated*, *secure* and *reproducible*. My path goes from embedded systems and IoT, through web development, to cloud and DevOps, so I understand systems *from the sensor to the cluster*.",

  specs: [
    ["Discipline", "Cloud & DevOps"],
    ["School", "ESPRIT · exchange at ESEO"],
    ["Based in", "Dijon, France"],
    ["Languages", "Arabic (native) · French B2 · English B2"],
    ["Distinction", "Ranked 1st in class · 17.10/20"],
    ["Looking for", "PFE internship · Feb 2027"],
  ],

  stamp: "OPEN FOR PFE ✦ FEB 2027 ✦ ",
};

/*
  Projects — shown in the "Selected work" index.
  - category: used by the filter buttons
  - image: optional screenshot, e.g. "assets/projects/skillhub.png".
           Without one, a unique DNA barcode is generated from the title.
  - live / code: links (leave "" to hide the button)
  - featured: true adds a ★ marker
*/
const PROJECTS = [
  {
    title: "SkillHub Cloud Platform",
    description:
      "IaaS infrastructure on OpenStack (VMs, networking, services) to host the SkillHub application, which I containerized and deployed on Kubernetes for orchestration, scalability and automated rollouts.",
    tags: ["OpenStack", "Docker", "Kubernetes"],
    category: "Cloud",
    year: "2026",
    image: "",
    live: "",
    code: "",
    featured: true,
  },
  {
    title: "Travolo",
    description:
      "Web and desktop app for solo travellers: accommodation, activities and carpooling. I owned the accommodation module and built a point-based payment system using NFC.",
    tags: ["Symfony 6", "PHP", "Java", "NFC"],
    category: "Web",
    year: "2025",
    image: "",
    live: "",
    code: "",
  },
  {
    title: "Remote Water-Pump Monitor",
    description:
      "IoT system to monitor and control a water pump remotely, with machine-learning anomaly detection, GSM remote control and a real-time Streamlit supervision dashboard.",
    tags: ["IoT", "Python", "Machine Learning", "Streamlit", "GSM"],
    category: "IoT",
    year: "2024",
    image: "",
    live: "",
    code: "",
    featured: true,
  },
];

/* Skills — shown as a "Genome map", one row per group */
const SKILLS = [
  { group: "Cloud & Virtualization", items: ["Docker", "Kubernetes", "Terraform", "Ansible", "OpenStack", "Virtualization"] },
  { group: "CI/CD", items: ["Git", "GitHub Actions"] },
  { group: "Security & Networking", items: ["FortiWeb WAF", "OWASP", "VPN", "Proxy", "Log analysis"] },
  { group: "Embedded & IoT", items: ["STM32", "Arduino", "ESP32", "Data acquisition", "IoT protocols"] },
  { group: "Web development", items: ["PHP", "Symfony", "Angular", "Spring Boot", ".NET", "REST APIs"] },
  { group: "Languages & Databases", items: ["C/C++", "Python", "Java", "MySQL", "Oracle"] },
  { group: "Systems & Methods", items: ["Linux (Ubuntu)", "Windows", "Agile (Scrum)", "CRISP-DM"] },
];

/* Experience — newest first */
const EXPERIENCE = [
  {
    period: "Jul 2026 — Sep 2026",
    role: "DevOps Intern",
    company: "RIF — Rassemblement des Ingénieurs Francophones",
    place: "Remote",
    points: [
      "Set up a VPN and a proxy to secure and control network traffic.",
      "Automated provisioning and configuration with Terraform and Ansible.",
      "Built a self-hosted CI/CD pipeline automating test, build and deployment.",
    ],
  },
  {
    period: "Jun 2026 — Aug 2026",
    role: "Cybersecurity Engineering Intern",
    company: "ACT — Advanced Computer Technologies",
    place: "Charguia, Tunisia",
    points: [
      "Deployed and configured a FortiWeb WAF to protect web applications.",
      "Wrote security rules against application attacks following OWASP best practices.",
      "Analysed security logs and events to identify and understand attack attempts.",
    ],
  },
  {
    period: "Jul 2025 — Aug 2025",
    role: "Software Development Intern",
    company: "Esprit Entreprise",
    place: "Ariana, Tunisia",
    points: [
      "Developed the offers module of an international mobility platform.",
      "Designed the interface and integrated features, working in a collaborative team.",
    ],
  },
  {
    period: "Jan 2024 — May 2024",
    role: "Final-Year Intern (Bachelor)",
    company: "Horizon-Data",
    place: "Manzah 1, Tunisia",
    points: [
      "Designed and built an IoT system to monitor a water pump.",
      "Implemented a machine-learning anomaly-detection algorithm.",
      "Built a real-time supervision interface with Streamlit and GSM remote control.",
    ],
  },
];

/* Education — newest first */
const EDUCATION = [
  {
    period: "Sep 2026 — Feb 2027",
    title: "Exchange semester — Smart City track",
    school: "ESEO",
    place: "Dijon, France",
    note: "Academic exchange programme between ESPRIT and ESEO.",
  },
  {
    period: "Sep 2024 — Present",
    title: "Engineering degree in Computer Science — Cloud Computing",
    school: "ESPRIT",
    place: "Ariana, Tunisia",
    note: "",
  },
  {
    period: "Sep 2021 — Jun 2024",
    title: "Bachelor in Computer Systems Engineering — Embedded Systems & IoT",
    school: "ISSAT Mateur",
    place: "Bizerte, Tunisia",
    note: "Ranked 1st in the institute with an average of 17.10/20 (2023–2024).",
  },
];
