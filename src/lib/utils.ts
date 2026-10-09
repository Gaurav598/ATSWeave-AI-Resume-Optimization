import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function escapeLatex(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([{}$&#^_%~])/g, "\\$1")
    .replace(/\n/g, " ");
}

/** Supports **bold**, *italic*, and __underline__ in form fields → LaTeX. */
export function formatInlineLatex(value: string) {
  let result = "";
  let i = 0;
  while (i < value.length) {
    if (value.startsWith("**", i)) {
      const end = value.indexOf("**", i + 2);
      if (end !== -1) {
        result += `\\textbf{${escapeLatex(value.slice(i + 2, end))}}`;
        i = end + 2;
        continue;
      }
    }
    if (value.startsWith("__", i)) {
      const end = value.indexOf("__", i + 2);
      if (end !== -1) {
        result += `\\underline{${escapeLatex(value.slice(i + 2, end))}}`;
        i = end + 2;
        continue;
      }
    }
    if (value[i] === "*" && value[i + 1] !== "*") {
      const end = value.indexOf("*", i + 1);
      if (end !== -1 && value[end + 1] !== "*") {
        result += `\\textit{${escapeLatex(value.slice(i + 1, end))}}`;
        i = end + 1;
        continue;
      }
    }
    // consume until next marker
    let next = value.length;
    for (const marker of ["**", "__", "*"]) {
      const idx = value.indexOf(marker, i);
      if (idx !== -1 && idx < next) next = idx;
    }
    result += escapeLatex(value.slice(i, next));
    i = next;
  }
  return result;
}

export function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatDateLabel(value?: string | null) {
  if (!value) return "";
  if (/present/i.test(value)) return "Present";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
