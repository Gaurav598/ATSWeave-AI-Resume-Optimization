import * as cheerio from "cheerio";
import type { CodingProfiles } from "@/lib/types";

export type FetchOutcome = {
  source: "leetcode" | "codeforces" | "gfg" | "codechef";
  status: "fetched" | "not-found" | "unavailable";
  detail?: string;
};

export type EnrichResult = {
  profiles: CodingProfiles;
  outcomes: FetchOutcome[];
};

const TIMEOUT_MS = 8000;

function handleFrom(url?: string) {
  if (!url?.trim()) return null;
  const cleaned = url.trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
  const last = cleaned.split("/").filter(Boolean).at(-1);
  return last || null;
}

async function request(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ATSWeave/1.0; +https://atsweave.example)",
        "Accept-Language": "en",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Codeforces' published rating tiers, used when its own label is localised. */
const CODEFORCES_TIERS: [number, string][] = [
  [3000, "legendary grandmaster"],
  [2600, "international grandmaster"],
  [2400, "grandmaster"],
  [2300, "international master"],
  [2100, "master"],
  [1900, "candidate master"],
  [1600, "expert"],
  [1400, "specialist"],
  [1200, "pupil"],
  [0, "newbie"],
];

/**
 * Codeforces answers in the caller's locale, which can put Cyrillic on an
 * English resume, so a non-Latin label is replaced with the rating's tier.
 */
function englishCodeforcesRank(rank: unknown, rating?: number): string | undefined {
  if (typeof rank === "string" && rank.trim() && /^[\x20-\x7E]+$/.test(rank)) {
    return rank.trim();
  }
  if (typeof rating !== "number") return undefined;
  return CODEFORCES_TIERS.find(([floor]) => rating >= floor)?.[1];
}

function firstNumber(value?: string | null) {
  if (!value) return undefined;
  const match = value.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

/**
 * Pulls public competitive-programming stats. Each source reports its own
 * outcome so the UI can say which ones actually worked instead of implying
 * that every field was filled.
 */
export async function enrichCodingProfiles(profiles: CodingProfiles): Promise<EnrichResult> {
  const stats = { ...(profiles.stats ?? {}) };
  const outcomes: FetchOutcome[] = [];

  const codeforces = handleFrom(profiles.codeforces);
  if (codeforces) {
    try {
      const res = await request(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(codeforces)}`,
      );
      const data = await res.json();
      const user = data?.result?.[0];
      if (user) {
        stats.codeforcesRating = user.rating ?? user.maxRating;
        stats.codeforcesRank = englishCodeforcesRank(
          user.rank ?? user.maxRank,
          stats.codeforcesRating,
        );
        outcomes.push({ source: "codeforces", status: "fetched" });
      } else {
        outcomes.push({ source: "codeforces", status: "not-found" });
      }
    } catch {
      outcomes.push({ source: "codeforces", status: "unavailable" });
    }
  }

  const leetcode = handleFrom(profiles.leetcode);
  if (leetcode) {
    try {
      const res = await request("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "query ($username: String!) { matchedUser(username: $username) { submitStatsGlobal { acSubmissionNum { difficulty count } } } }",
          variables: { username: leetcode },
        }),
      });
      const json = await res.json();
      const all = json?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum?.find(
        (row: { difficulty: string }) => row.difficulty === "All",
      );
      if (all?.count) {
        stats.leetcodeSolved = all.count;
        outcomes.push({ source: "leetcode", status: "fetched" });
      } else {
        outcomes.push({ source: "leetcode", status: "not-found" });
      }
    } catch {
      outcomes.push({ source: "leetcode", status: "unavailable" });
    }
  }

  const codechef = handleFrom(profiles.codechef);
  if (codechef) {
    try {
      const res = await request(`https://www.codechef.com/users/${encodeURIComponent(codechef)}`);
      if (!res.ok) throw new Error(String(res.status));
      const $ = cheerio.load(await res.text());
      const rating = firstNumber($(".rating-number").first().text());
      if (rating) {
        stats.codechefRating = rating;
        outcomes.push({ source: "codechef", status: "fetched" });
      } else {
        outcomes.push({ source: "codechef", status: "not-found" });
      }
    } catch {
      outcomes.push({ source: "codechef", status: "unavailable" });
    }
  }

  const gfg = handleFrom(profiles.gfg);
  if (gfg) {
    try {
      const res = await request(`https://www.geeksforgeeks.org/user/${encodeURIComponent(gfg)}/`);
      if (!res.ok) throw new Error(String(res.status));
      const html = await res.text();
      const $ = cheerio.load(html);
      // The profile card labels the count; fall back to the embedded JSON payload.
      const labelled = $("*")
        .filter((_, el) => /problem(s)?\s+solved/i.test($(el).text()) && $(el).children().length === 0)
        .parent()
        .text();
      const solved =
        firstNumber(labelled) ?? firstNumber(html.match(/"total_problems_solved":\s*"?(\d+)"?/)?.[1]);
      if (solved) {
        stats.gfgSolved = solved;
        outcomes.push({ source: "gfg", status: "fetched" });
      } else {
        outcomes.push({ source: "gfg", status: "not-found" });
      }
    } catch {
      outcomes.push({ source: "gfg", status: "unavailable" });
    }
  }

  return { profiles: { ...profiles, stats }, outcomes };
}
