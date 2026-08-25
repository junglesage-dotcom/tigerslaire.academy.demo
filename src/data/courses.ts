export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  tags: string[];
  bullets: string[];
  msg: number; // telegram channel message id
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  tagline: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  path: string;
  weeks: number;
  price: number;
  hue: string;
  icon: "python" | "business" | "shield";
  summary: string;
  outcomes: string[];
  skills: string[];
  channel: string;
  modules: Module[];
  quiz: QuizQ[];
}

export const fmtNaira = (n: number) => "₦" + n.toLocaleString("en-NG");

export const courseLessons = (c: Course): Lesson[] => c.modules.flatMap((m) => m.lessons);
export const totalUnits = (c: Course) => courseLessons(c).length + 1; // +1 for the quiz gate
export const courseMinutes = (c: Course) => courseLessons(c).reduce((a, l) => a + l.minutes, 0);

const L = (
  id: string,
  title: string,
  minutes: number,
  tags: string[],
  bullets: string[],
  msg: number
): Lesson => ({ id, title, minutes, tags, bullets, msg });

export const COURSES: Course[] = [
  {
    id: "py101",
    code: "PY101",
    title: "Python for Data Analysis",
    tagline: "From zero syntax to cleaning, analysing and visualising real Nigerian datasets.",
    level: "Beginner",
    path: "Beginner → Intermediate",
    weeks: 8,
    price: 45000,
    hue: "#ffa41b",
    icon: "python",
    summary:
      "Eight weeks of practical Python built around data you recognise — market prices, telco churn, survey exports. Every lesson drops into the private Telegram channel as a lecture, a PDF and an assignment; the website tracks what you finish.",
    outcomes: [
      "Write confident Python: variables, flow control, functions and modules",
      "Load, clean and reshape messy CSVs with NumPy and Pandas",
      "Group, merge and aggregate datasets the way analysts actually do",
      "Tell the story with Matplotlib charts ready for reports",
      "Ship a capstone analysis of Lagos open-market prices",
    ],
    skills: ["Python 3", "NumPy", "Pandas", "Matplotlib", "CSV wrangling"],
    channel: "t.me/lair_py101",
    modules: [
      {
        title: "Python foundations",
        lessons: [
          L("py-01", "Introduction & environment setup", 18, ["Video", "PDF"], [
            "Installing Python, VS Code and Jupyter on any machine",
            "How the lair workflow runs: website tracks, Telegram delivers",
          ], 301),
          L("py-02", "Variables & data types", 26, ["Video", "PDF", "Assignment"], [
            "Strings, numbers, booleans — and when types bite back",
            "f-strings and the habits that keep code readable",
          ], 306),
          L("py-03", "Control flow & loops", 32, ["Video", "Code"], [
            "if / elif / else without spaghetti",
            "for and while loops over real lists of transactions",
          ], 312),
        ],
      },
      {
        title: "Working with data",
        lessons: [
          L("py-04", "Functions & modules", 30, ["Video", "Code"], [
            "Parameters, returns, and splitting code into modules",
            "Writing a reusable clean_price() function",
          ], 318),
          L("py-05", "Files, CSVs & encodings", 28, ["Video", "PDF", "Assignment"], [
            "Reading and writing CSVs the safe way",
            "Dealing with ₦ symbols, commas and broken encodings",
          ], 324),
          L("py-06", "NumPy arrays & vectorised math", 34, ["Video", "Code"], [
            "Arrays vs lists — why speed matters at 100k rows",
            "Masking, broadcasting and summary statistics",
          ], 331),
        ],
      },
      {
        title: "Pandas, properly",
        lessons: [
          L("py-07", "Series & DataFrames", 36, ["Video", "PDF"], [
            "The two structures behind almost every analysis",
            "Selecting columns, rows and slices by label or position",
          ], 338),
          L("py-08", "Filtering & groupby", 40, ["Video", "Code", "Assignment"], [
            "Boolean masks for questions like 'which region sold most?'",
            "groupby + agg: the analyst's daily bread",
          ], 345),
          L("py-09", "Merging & reshaping datasets", 33, ["Video", "PDF"], [
            "merge, concat and the join types that trip people up",
            "Pivots and melt: long vs wide data",
          ], 352),
        ],
      },
      {
        title: "Analysis in practice",
        lessons: [
          L("py-10", "Cleaning messy real-world data", 38, ["Video", "Code"], [
            "Missing values, duplicates and silent type lies",
            "A repeatable cleaning pipeline you can defend",
          ], 359),
          L("py-11", "Visualising with Matplotlib", 35, ["Video", "PDF", "Assignment"], [
            "Line, bar and scatter charts that answer a question",
            "Labelling, titles and exporting for reports",
          ], 366),
          L("py-12", "Capstone — Lagos market price index", 45, ["Code", "Assignment"], [
            "End-to-end analysis on a 40k-row market dataset",
            "Findings memo + charts, delivered to the channel for review",
          ], 373),
        ],
      },
    ],
    quiz: [
      {
        q: "Which structure does Pandas use for a labelled 2-D table?",
        options: ["Array", "DataFrame", "Dictionary", "Tensor"],
        answer: 1,
      },
      {
        q: "What does df.groupby('region')['sales'].mean() return?",
        options: [
          "The total sales per region",
          "A filtered DataFrame of regions",
          "Mean sales computed per region",
          "A sorted list of regions",
        ],
        answer: 2,
      },
      {
        q: "Which is the vectorised way to double every value in a NumPy array a?",
        options: ["for x in a: x*2", "a.map(x => x*2)", "a * 2", "double(a)"],
        answer: 2,
      },
      {
        q: "A CSV column of prices reads as strings like '₦4,500'. First step before analysis?",
        options: [
          "Plot it immediately",
          "Strip symbols/commas and cast to numeric",
          "Delete the column",
          "Convert to boolean",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "ba202",
    code: "BA202",
    title: "Business Analysis Essentials",
    tagline: "Turn vague business problems into requirements, models and decisions people act on.",
    level: "Beginner",
    path: "Beginner → Job-ready",
    weeks: 6,
    price: 38000,
    hue: "#57d9a3",
    icon: "business",
    summary:
      "A six-week foundation for aspiring business analysts: stakeholder interviews, requirements, classic models and the reporting that makes analysis stick. Lean, practical, and assessed with a retail case study.",
    outcomes: [
      "Run stakeholder interviews that surface real requirements",
      "Apply SWOT, PESTLE and process mapping without cargo-culting",
      "Pick KPIs that change decisions, not just fill dashboards",
      "Structure findings into stories executives actually read",
      "Deliver a full case-study analysis of a retail chain",
    ],
    skills: ["Requirements", "SWOT/PESTLE", "Process mapping", "KPIs", "Data storytelling"],
    channel: "t.me/lair_ba202",
    modules: [
      {
        title: "Thinking like an analyst",
        lessons: [
          L("ba-01", "What business analysts actually do", 20, ["Video", "PDF"], [
            "The role across projects, products and operations",
            "Where analysts sit between tech and the business",
          ], 201),
          L("ba-02", "Stakeholders & requirements gathering", 28, ["Video", "PDF", "Assignment"], [
            "Mapping stakeholders by power and interest",
            "Interviews, workshops and the 'five whys'",
          ], 207),
        ],
      },
      {
        title: "Models that earn their keep",
        lessons: [
          L("ba-03", "SWOT & PESTLE in practice", 25, ["Video", "PDF"], [
            "Using both models on one real Nigerian SME",
            "Turning findings into prioritised actions",
          ], 214),
          L("ba-04", "Process mapping & bottlenecks", 30, ["Video", "Assignment"], [
            "As-is vs to-be maps with simple notation",
            "Spotting queues, rework and silent costs",
          ], 221),
          L("ba-05", "KPIs & metrics that matter", 27, ["Video", "PDF", "Assignment"], [
            "Leading vs lagging indicators",
            "Designing a one-page KPI tree for a shop chain",
          ], 228),
        ],
      },
      {
        title: "Communication & delivery",
        lessons: [
          L("ba-06", "Data storytelling", 30, ["Video", "PDF"], [
            "Pyramid principle: answer first, evidence after",
            "Choosing the chart your audience can't misread",
          ], 235),
          L("ba-07", "Dashboards & reporting cadence", 32, ["Video", "Code"], [
            "Weekly vs monthly reporting rhythms",
            "Annotating dashboards so they argue for themselves",
          ], 242),
          L("ba-08", "Capstone — retail turnaround case", 40, ["Assignment"], [
            "Diagnose a struggling retail chain from its numbers",
            "Present a 10-slide recommendation memo",
          ], 249),
        ],
      },
    ],
    quiz: [
      {
        q: "Which is a leading indicator for a retail business?",
        options: ["Last quarter's revenue", "Foot traffic this week", "Annual profit", "Closed store count"],
        answer: 1,
      },
      {
        q: "In the pyramid principle, a good recommendation memo starts with…",
        options: ["Methodology", "The answer", "Data appendix", "Team bios"],
        answer: 1,
      },
      {
        q: "PESTLE analysis scans which environment?",
        options: ["Internal team skills", "Macro environment", "Code quality", "Server costs"],
        answer: 1,
      },
    ],
  },
  {
    id: "eh301",
    code: "EH301",
    title: "Ethical Hacking Foundations",
    tagline: "Recon, scanning and web fundamentals — practised legally, reported professionally.",
    level: "Intermediate",
    path: "Intermediate → Practitioner",
    weeks: 10,
    price: 60000,
    hue: "#ff6b3d",
    icon: "shield",
    summary:
      "Ten disciplined weeks inside a safe lab: how the internet actually works, Linux fluency, recon and Nmap, the OWASP top 10, and the reporting that separates professionals from script kiddies. All targets are owned lab machines — always.",
    outcomes: [
      "Explain how the internet works below the abstractions",
      "Drive Linux from the command line without fear",
      "Run structured recon and Nmap scans against lab targets",
      "Understand the OWASP top 10 with live demonstrations",
      "Write a professional findings report with risk ratings",
    ],
    skills: ["Linux", "Networking", "Nmap", "OSINT", "OWASP", "Reporting"],
    channel: "t.me/lair_eh301",
    modules: [
      {
        title: "Groundwork",
        lessons: [
          L("eh-01", "Ethics, law & scope", 24, ["Video", "Reading"], [
            "What makes hacking 'ethical': permission and scope",
            "A walkthrough of a simple rules-of-engagement document",
          ], 401),
          L("eh-02", "How the internet actually works", 30, ["Video", "PDF"], [
            "Packets, IP, TCP/UDP and DNS — with live traces",
            "Reading a request/response lifecycle end to end",
          ], 408),
          L("eh-03", "Linux from the command line", 36, ["Video", "Code", "Assignment"], [
            "Files, permissions, pipes and processes",
            "Building your attacker workstation (legally, in a VM)",
          ], 415),
        ],
      },
      {
        title: "The offensive toolkit",
        lessons: [
          L("eh-04", "Recon & OSINT", 34, ["Video", "Code"], [
            "Passive vs active recon, and what's public anyway",
            "Building a target profile with open sources",
          ], 422),
          L("eh-05", "Scanning with Nmap", 38, ["Video", "Code", "Assignment"], [
            "Host discovery, port scans and service versions",
            "Reading Nmap output like a professional",
          ], 429),
          L("eh-06", "Web apps & the OWASP top 10", 42, ["Video", "PDF"], [
            "Injection, broken auth and friends — demonstrated safely",
            "How defenders use the same list to harden apps",
          ], 436),
        ],
      },
      {
        title: "Practice & professionalism",
        lessons: [
          L("eh-07", "Passwords & hashing", 30, ["Video", "PDF"], [
            "Hashes, salts and why 'password123' dies in seconds",
            "Offline cracking lab on your own hashes only",
          ], 443),
          L("eh-08", "Introduction to Metasploit", 40, ["Video", "Code"], [
            "Modules, payloads and handlers — in a closed lab",
            "When frameworks help and when they hide the lesson",
          ], 450),
          L("eh-09", "Writing the findings report", 28, ["Video", "PDF", "Assignment"], [
            "Executive summary, evidence, risk rating, fixes",
            "A template you can reuse in real engagements",
          ], 457),
          L("eh-10", "Capstone — safe lab attack & report", 50, ["Code", "Assignment"], [
            "Full chain: recon → scan → exploit lab box → report",
            "Peer review inside the private channel",
          ], 464),
        ],
      },
    ],
    quiz: [
      {
        q: "What legally separates ethical hacking from crime?",
        options: ["Better tools", "Written permission and scope", "Using Linux", "Anonymity"],
        answer: 1,
      },
      {
        q: "Which Nmap flag set probes service versions?",
        options: ["-sV", "-x", "--fast-only", "-ping"],
        answer: 0,
      },
      {
        q: "Storing passwords as salted hashes means…",
        options: [
          "Passwords can be reversed easily",
          "The same password yields different hashes per user",
          "Hashes are encrypted passwords",
          "Salts are kept secret in the hash",
        ],
        answer: 1,
      },
      {
        q: "The FIRST section of a professional pentest report is the…",
        options: ["Tool list", "Executive summary", "Raw scan output", "Invoice"],
        answer: 1,
      },
    ],
  },
];

export const getCourse = (id: string) => COURSES.find((c) => c.id === id);

export const TICKER_ITEMS = [
  "PY101 · PYTHON FOR DATA ANALYSIS — ₦45,000",
  "BA202 · BUSINESS ANALYSIS ESSENTIALS — ₦38,000",
  "EH301 · ETHICAL HACKING FOUNDATIONS — ₦60,000",
  "NEXT COHORT OPENS MARCH 3",
  "PRIVATE TELEGRAM CHANNELS FOR EVERY COURSE",
  "CERTIFICATES ISSUED FROM YOUR OWN DATABASE",
  "MINI APP ARRIVES IN PHASE 4",
];

export const JOURNEY = [
  {
    step: "01",
    title: "Visit the academy",
    body: "Your website is the front door — catalogue, prices, outcomes. No paywall to look around.",
  },
  {
    step: "02",
    title: "Create an account & enrol",
    body: "One student record is written to your own database: name, email, enrolment, progress.",
  },
  {
    step: "03",
    title: "Link Telegram",
    body: "The student starts @TigersLairBot, pastes a one-time code, and the bot ties their Telegram ID to their account.",
  },
  {
    step: "04",
    title: "Weekly drops land",
    body: "Lectures, PDFs and assignments arrive in the private course channel. Lesson 17 always knows it is message #348.",
  },
  {
    step: "05",
    title: "Progress, everywhere",
    body: "Website, bot, Mini App and — later — the Flutter app all read the same progress table.",
  },
  {
    step: "06",
    title: "Certificate issued",
    body: "Quiz passed, lessons complete → a verifiable certificate ID, announced on all linked channels.",
  },
];
