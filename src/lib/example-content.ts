import type { ResumeContent } from "@/lib/types";

/**
 * One example dataset, used for every template preview.
 *
 * Using the same content everywhere means the gallery shows the difference
 * between templates rather than the difference between sample people. This is
 * never written into a user's resume unless they explicitly load it.
 */
export const EXAMPLE_LABEL = "Example content — not a real person";

const EXAMPLE_RESUME: ResumeContent = {
  fullName: "Aarav Mehta",
  email: "aarav.mehta@example.com",
  phone: "Demo number unavailable",
  location: "Bengaluru, India",
  linkedinUrl: "https://linkedin.com/in/example",
  githubUrl: "https://github.com/example",
  portfolioUrl: "",
  targetRole: "SWE",
  summary:
    "Backend engineer with 4 years building payment and identity services at scale. Owns systems end to end, from schema design to on-call.",
  skills: [],
  skillCategories: {
    languages: ["Go", "TypeScript", "Python", "SQL"],
    frameworks: ["gRPC", "Next.js", "PostgreSQL", "Kafka"],
    tools: ["AWS", "Docker", "Kubernetes", "Terraform", "Grafana"],
  },
  experience: [
    {
      company: "Razorpay",
      title: "Senior Software Engineer",
      location: "Bengaluru, India",
      startDate: "2023-01",
      endDate: "",
      bullets: [
        "Rebuilt the settlement ledger on Go and Postgres, cutting reconciliation time from 6 hours to 11 minutes for 2M daily transactions.",
        "Led migration of 14 services to gRPC, reducing p99 latency by 38% and removing 3 classes of retry bugs.",
        "Introduced contract tests across payment partners, dropping production incidents from 9 to 2 per quarter.",
      ],
    },
    {
      company: "Zeta",
      title: "Software Engineer",
      location: "Bengaluru, India",
      startDate: "2021-06",
      endDate: "2022-12",
      bullets: [
        "Built an idempotent webhook delivery pipeline on Kafka handling 40M events per day with at-least-once guarantees.",
        "Cut AWS spend 22% by right-sizing workloads and moving cold ledger data to S3 with lifecycle policies.",
      ],
    },
  ],
  education: [
    {
      school: "Birla Institute of Technology and Science, Pilani",
      degree: "B.E.",
      field: "Computer Science",
      location: "Pilani, India",
      startDate: "2017-08",
      endDate: "2021-05",
      gpa: "8.7/10",
      highlights: [],
    },
  ],
  projects: [
    {
      name: "ledger-lite",
      description: "",
      bullets: [
        "Open-source double-entry ledger in Go with deterministic replay; 900+ GitHub stars and used by 3 fintech startups.",
      ],
      link: "https://github.com/example/ledger-lite",
      tech: ["Go", "PostgreSQL", "gRPC"],
    },
  ],
  certifications: [
    { name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", date: "2023" },
  ],
  codingProfiles: {
    leetcode: "https://leetcode.com/example",
    codeforces: "https://codeforces.com/profile/example",
    stats: {
      leetcodeSolved: 640,
      codeforcesRating: 1742,
      codeforcesRank: "expert",
    },
  },
};

export function exampleResume(): ResumeContent {
  return structuredClone(EXAMPLE_RESUME);
}

/** True when the resume still holds the gallery example, not the user's own data. */
export function isExampleContent(content?: ResumeContent | null) {
  if (!content) return false;
  return (
    content.email?.trim().toLowerCase() === EXAMPLE_RESUME.email.toLowerCase() ||
    content.fullName?.trim() === EXAMPLE_RESUME.fullName
  );
}
