/** Example resume used only by the public ATS checker "load sample" action. */
export const SAMPLE_ATS_RESUME_TEXT = `Aarav Mehta
aarav.mehta@example.com | Demo number unavailable | Bengaluru, India
linkedin.com/in/example | github.com/example

SUMMARY
Backend engineer with 4 years building payment and identity services at scale. Owns systems end to end, from schema design to on-call. Strong TypeScript, Node.js, PostgreSQL, Redis, Docker, and AWS.

SKILLS
Languages: Go, TypeScript, Python, SQL
Frameworks: gRPC, Next.js, PostgreSQL, Kafka
Tools: AWS, Docker, Kubernetes, Terraform, Grafana, CI/CD, REST APIs

EXPERIENCE
Senior Software Engineer, Razorpay | Bengaluru, India | 2023-01 – Present
• Rebuilt the settlement ledger on Go and Postgres, cutting reconciliation time from 6 hours to 11 minutes for 2M daily transactions.
• Led migration of 14 services to gRPC, reducing p99 latency by 38% and removing 3 classes of retry bugs.
• Introduced contract tests across payment partners, dropping production incidents from 9 to 2 per quarter.
• Designed highly available payment APIs used by millions of businesses with Redis caching and Dockerized deploys.

Software Engineer, Zeta | Bengaluru, India | 2021-06 – 2022-12
• Built an idempotent webhook delivery pipeline on Kafka handling 40M events per day with at-least-once guarantees.
• Cut AWS spend 22% by right-sizing workloads and moving cold ledger data to S3 with lifecycle policies.
• Shipped REST APIs in TypeScript/Node.js with CI/CD on GitHub Actions.

EDUCATION
Birla Institute of Technology and Science, Pilani | B.E. in Computer Science | GPA 8.7/10 | 2017-08 – 2021-05

PROJECTS
ledger-lite | Go, PostgreSQL, gRPC
• Open-source double-entry ledger in Go with deterministic replay; 900+ GitHub stars and used by 3 fintech startups.

CERTIFICATIONS
AWS Certified Solutions Architect – Associate — Amazon Web Services, 2023
`;
