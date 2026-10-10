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
  email: "ghassenkahya@gmail.com",
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
    id: "skillhub",
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
    id: "travolo",
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
    id: "pump",
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

/*
  Skills — shown as a "Toolchain": stages in the order data travels,
  from the sensor to the cluster.
  - core: true marks a main Cloud/DevOps skill
  - icon: key in icons.js (brand logo or outline icon)
  - used: ids of the experiences / projects where the skill was applied
          (shown when a visitor selects the skill)
*/
const SKILLS = [
  {
    stage: "Sense",
    group: "Embedded & IoT",
    blurb: "Microcontrollers, sensors and the data they produce.",
    items: [
      { name: "STM32", icon: "stmicroelectronics" },
      { name: "ESP32", icon: "espressif" },
      { name: "Arduino", icon: "arduino" },
      { name: "Data acquisition", icon: "chip", used: ["horizon"] },
      { name: "IoT & GSM comms", icon: "signal", used: ["horizon"] },
      { name: "ML anomaly detection", icon: "anomaly", used: ["horizon"] },
      { name: "Streamlit", icon: "streamlit", used: ["horizon"] },
    ],
  },
  {
    stage: "Build",
    group: "Code & data",
    blurb: "Languages, frameworks and databases.",
    items: [
      { name: "Python", icon: "python", used: ["horizon"] },
      { name: "Java", icon: "openjdk", used: ["travolo"] },
      { name: "C/C++", icon: "cplusplus" },
      { name: "PHP", icon: "php", used: ["travolo"] },
      { name: "Symfony", icon: "symfony", used: ["travolo"] },
      { name: "Angular", icon: "angular" },
      { name: "Spring Boot", icon: "springboot" },
      { name: ".NET", icon: "dotnet" },
      { name: "REST APIs", icon: "api" },
      { name: "MySQL", icon: "mysql" },
      { name: "Oracle", icon: "oracle" },
    ],
  },
  {
    stage: "Ship",
    group: "CI/CD & automation",
    blurb: "Version control, pipelines and infrastructure as code.",
    items: [
      { name: "CI/CD pipelines", icon: "pipeline", core: true, used: ["rif"] },
      { name: "Terraform", icon: "terraform", core: true, used: ["rif"] },
      { name: "Ansible", icon: "ansible", core: true, used: ["rif"] },
      { name: "Git", icon: "git", used: ["rif"] },
      { name: "GitHub Actions", icon: "githubactions" },
    ],
  },
  {
    stage: "Run",
    group: "Cloud & containers",
    blurb: "Containers, orchestration and private cloud.",
    items: [
      { name: "Kubernetes", icon: "kubernetes", core: true, used: ["skillhub"] },
      { name: "Docker", icon: "docker", core: true, used: ["skillhub"] },
      { name: "OpenStack", icon: "openstack", core: true, used: ["skillhub"] },
      { name: "Linux (Ubuntu)", icon: "ubuntu", core: true },
      { name: "Virtualization", icon: "layers", used: ["skillhub"] },
      { name: "Windows", icon: "window" },
    ],
  },
  {
    stage: "Secure",
    group: "Security & networks",
    blurb: "Protecting applications and the traffic between them.",
    items: [
      { name: "FortiWeb WAF", icon: "fortinet", used: ["act"] },
      { name: "OWASP", icon: "owasp", used: ["act"] },
      { name: "Log analysis", icon: "logs", used: ["act"] },
      { name: "VPN", icon: "shield", used: ["rif"] },
      { name: "Proxy", icon: "proxy", used: ["rif"] },
    ],
  },
];

/* Shown under the toolchain. Language level uses the CEFR scale (A1–C2) or "Native". */
const SKILL_EXTRAS = {
  languages: [
    { name: "Arabic", level: "Native" },
    { name: "French", level: "B2" },
    { name: "English", level: "B2" },
  ],
  methods: ["Agile (Scrum)", "CRISP-DM", "Functional analysis"],
  soft: ["Analytical thinking", "Autonomy", "Effective collaboration", "Clear communication"],
};

/* Experience — newest first */
const EXPERIENCE = [
  {
    id: "rif",
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
    id: "act",
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
    id: "esprit",
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
    id: "horizon",
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
