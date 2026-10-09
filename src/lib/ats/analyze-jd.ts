import type { JdAnalysis } from "@/lib/types";
import { normalizeKeyword, unique } from "@/lib/utils";

/** Common tech / role terms used by real ATS keyword filters (Workday/Taleo-style exact match). */
const SKILL_LEXICON = [
  "TypeScript", "JavaScript", "Python", "Java", "Go", "Golang", "Rust", "C++", "C#", "Kotlin", "Swift",
  "React", "Next.js", "Angular", "Vue", "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI",
  "Spring", "Rails", ".NET", "GraphQL", "REST", "gRPC",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "RabbitMQ", "SQLite", "SQL",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD", "Jenkins", "GitHub Actions",
  "Linux", "Git", "Microservices", "System Design", "Distributed Systems", "Machine Learning", "PyTorch",
  "TensorFlow", "Pandas", "Spark", "Airflow", "dbt", "Snowflake", "BigQuery", "Tableau", "Power BI",
  "Figma", "Product Management", "Agile", "Scrum", "Jira", "A/B Testing", "SEO", "Analytics",
  "Communication", "Leadership", "Problem Solving", "Ownership",
];

const SYNONYMS: Record<string, string[]> = {
  javascript: ["js", "ecmascript"],
  typescript: ["ts"],
  "node.js": ["nodejs", "node"],
  "next.js": ["nextjs", "next"],
  kubernetes: ["k8s", "kube"],
  postgresql: ["postgres", "psql"],
  "ci/cd": ["cicd", "continuous integration", "continuous delivery"],
  "machine learning": ["ml", "deep learning"],
  golang: ["go"],
  "c++": ["cpp", "cplusplus"],
  "c#": ["csharp", "c sharp"],
  amazon: ["aws"],
  "google cloud": ["gcp"],
};

/**
 * Extract JD requirements without inventing skills.
 * Prefer AI when available; this is the deterministic fallback used by the public checker.
 */
export function analyzeJobDescriptionHeuristic(jd: string): JdAnalysis {
  const text = jd.replace(/\r/g, "\n");
  const lower = text.toLowerCase();

  const foundSkills = SKILL_LEXICON.filter((skill) => {
    const n = normalizeKeyword(skill);
    if (n.length <= 2) return new RegExp(`\\b${escapeReg(n)}\\b`, "i").test(lower);
    return lower.includes(n);
  });

  // Capitalized phrases often name tools or products. Kept to a single line so
  // a heading never joins the sentence under it ("Razorpay" + "About the role").
  const phraseHits = Array.from(
    text.matchAll(/\b([A-Z][A-Za-z0-9+#./-]{1,}(?:[ \t]+[A-Z][A-Za-z0-9+#./-]{1,}){0,3})\b/g),
  )
    .map((m) => m[1].trim())
    .filter(isUsefulKeyword);

  const mustSection = sliceSection(text, /(requirements|must[- ]have|what you.?ll need|qualifications|required)/i);
  const niceSection = sliceSection(text, /(nice[- ]to[- ]have|preferred|bonus|good to have)/i);

  const fromMust = extractListedItems(mustSection).concat(
    foundSkills.filter((s) => mustSection.toLowerCase().includes(s.toLowerCase())),
  );
  const fromNice = extractListedItems(niceSection);

  let mustHaveKeywords = unique(
    (fromMust.length ? fromMust : foundSkills.slice(0, 10)).map((k) => k.trim()).filter(Boolean),
  ).slice(0, 14);

  let niceToHaveKeywords = unique(
    [...fromNice, ...foundSkills.slice(mustHaveKeywords.length), ...phraseHits]
      .map((k) => k.trim())
      .filter((k) => k && !mustHaveKeywords.some((m) => normalizeKeyword(m) === normalizeKeyword(k))),
  ).slice(0, 16);

  if (!mustHaveKeywords.length && foundSkills.length) {
    mustHaveKeywords = foundSkills.slice(0, 8);
    niceToHaveKeywords = foundSkills.slice(8, 16);
  }

  const seniorityLevel = /staff|principal|distinguished/i.test(jd)
    ? "staff"
    : /senior|sr\./i.test(jd)
      ? "senior"
      : /intern|junior|entry/i.test(jd)
        ? "junior"
        : "mid";

  const responsibilities = extractListedItems(
    sliceSection(text, /(responsibilities|what you.?ll do|about the role|the role)/i),
  ).slice(0, 10);

  return {
    hardSkills: unique(foundSkills).slice(0, 24),
    softSkills: ["Communication", "Leadership", "Problem Solving", "Ownership"].filter((s) =>
      lower.includes(s.toLowerCase()),
    ),
    tools: foundSkills.filter((k) =>
      /aws|gcp|azure|docker|kubernetes|jenkins|jira|git|terraform|figma|tableau/i.test(k),
    ),
    seniorityLevel,
    keyResponsibilities: responsibilities,
    mustHaveKeywords,
    niceToHaveKeywords,
  };
}

export function keywordVariants(keyword: string): string[] {
  const base = normalizeKeyword(keyword);
  const extras = SYNONYMS[base] ?? [];
  const collapsed = base.replace(/[./\s-]+/g, "");
  return unique([base, ...extras, collapsed].filter((v) => v.length >= 2));
}

/** True if resume text contains keyword or a known synonym (exact / word-boundary when short). */
export function resumeHasKeyword(resumeLower: string, keyword: string): boolean {
  for (const variant of keywordVariants(keyword)) {
    if (variant.length <= 3) {
      if (new RegExp(`\\b${escapeReg(variant)}\\b`, "i").test(resumeLower)) return true;
    } else if (resumeLower.includes(variant)) {
      return true;
    }
  }
  return false;
}

function escapeReg(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Headings and boilerplate that read like requirements but name no skill. */
const BOILERPLATE =
  /^(must|nice|good|requirements?|qualifications?|responsibilities|preferred|bonus|benefits|about|the role|what you.?ll (do|need)|who you are|we offer|apply|location|salary|compensation|equal opportunity)\b/i;

/** Words that carry no signal on their own, however they are capitalised. */
const FILLER_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "building", "but", "by", "can", "day", "design", "do",
  "experience", "for", "from", "have", "in", "is", "it", "look", "looking", "of", "on", "or", "our",
  "role", "ship", "skills", "strong", "team", "teams", "that", "the", "them", "this", "to", "up",
  "we", "will", "with", "work", "working", "you", "your", "years", "plus", "must", "nice", "good",
  "great", "excellent", "ability", "able", "help", "join", "hiring", "used", "using", "across",
]);

const LEXICON_LOOKUP = new Set(SKILL_LEXICON.map((s) => normalizeKeyword(s)));

/**
 * Keeps candidates a reader would recognise as a requirement.
 *
 * JD prose is full of capitalised sentence starts ("Strong", "Must"), so a
 * candidate has to be a known skill, look like a technical token, or be a
 * multi-word phrase that is not all filler.
 */
function isUsefulKeyword(raw: string): boolean {
  const value = raw.replace(/[:.,;]+$/, "").trim();
  if (value.length < 2 || value.length > 40) return false;
  if (BOILERPLATE.test(value)) return false;
  if (LEXICON_LOOKUP.has(normalizeKeyword(value))) return true;

  const words = value.split(/\s+/);
  if (words.every((w) => FILLER_WORDS.has(w.toLowerCase()))) return false;

  if (words.length === 1) {
    // A lone word only counts if it looks like a technical token: an acronym
    // or something carrying punctuation/digits, e.g. SQL, CI/CD, Next.js, S3.
    return /^[A-Z0-9]{2,}$/.test(value) || /[0-9+#./]/.test(value);
  }
  return true;
}

function sliceSection(text: string, heading: RegExp): string {
  const match = heading.exec(text);
  if (!match || match.index == null) return "";
  const start = match.index;
  const rest = text.slice(start);
  const next = rest.search(/\n\s*(requirements|responsibilities|qualifications|benefits|about |what you|nice|preferred|must)\b/i);
  // Skip the matched heading itself for "next" — find subsequent heading after first line
  const afterFirstLine = rest.indexOf("\n");
  const body = afterFirstLine >= 0 ? rest.slice(afterFirstLine) : rest;
  const cut = body.search(/\n\s*[A-Z][A-Za-z /&]{3,40}\n/);
  if (next > 40) return rest.slice(0, next);
  if (cut > 40) return rest.slice(0, afterFirstLine + cut);
  return rest.slice(0, 1200);
}

/** Lead-ins that wrap a requirement without being part of the skill itself. */
const LEAD_IN =
  /^(\d+\+?\s*years?(\s+of)?(\s+\w+)?\s+(with|in|using)|experience\s+(with|in)|proficien(t|cy)\s+(with|in)|familiarity\s+with|knowledge\s+of|understanding\s+of|strong|solid|deep|hands[- ]on(\s+experience)?(\s+with)?|background\s+in|exposure\s+to)\s+/i;

function tidyItem(raw: string): string {
  return raw
    .replace(/^[\s•\-*–—]+/, "")
    // Ordered-list numbering only; a bare "5+ years…" keeps its number so the
    // lead-in below can recognise and strip the whole phrase.
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\s+/g, " ")
    .replace(LEAD_IN, "")
    .replace(/^[\s•\-*–—]+/, "")
    .replace(/[:.,;]+$/, "")
    .trim();
}

/** Skill names from the lexicon that appear in a line of text. */
function lexiconSkillsIn(line: string): string[] {
  const lower = line.toLowerCase();
  return SKILL_LEXICON.filter((skill) => {
    const n = normalizeKeyword(skill);
    if (n.length <= 2) return new RegExp(`\\b${escapeReg(n)}\\b`, "i").test(lower);
    return lower.includes(n);
  });
}

/**
 * Pulls requirement items out of a bulleted section.
 *
 * A requirement written as prose ("Experience with PostgreSQL, Redis, and REST
 * APIs") is reported as the skills it names, not as the sentence — a user can
 * act on "Redis" but not on a sentence fragment. Lines naming no known skill
 * are kept whole so genuinely domain-specific asks still surface.
 */
function extractListedItems(section: string): string[] {
  if (!section) return [];
  const items: string[] = [];

  for (const line of section.split(/\n+/)) {
    const cleaned = tidyItem(line);
    if (cleaned.length < 2 || cleaned.length > 120) continue;
    if (BOILERPLATE.test(cleaned)) continue;

    const skills = lexiconSkillsIn(cleaned);
    if (skills.length) {
      items.push(...skills);
      continue;
    }

    const parts = cleaned.split(",").map(tidyItem).filter(Boolean);
    const isTokenList =
      parts.length > 1 &&
      parts.every((part) => part.split(" ").length <= 3 && !/^(and|or|plus|with)\b/i.test(part));

    if (isTokenList) {
      items.push(...parts.filter((part) => part.length >= 2 && part.length <= 40));
    } else if (cleaned.split(" ").length <= 6) {
      items.push(cleaned);
    }
  }

  return unique(items.filter(isUsefulKeyword)).slice(0, 20);
}
