export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_PDF_PAGES = 12;
export const MAX_EXTRACT_CHARS = 80_000;

export function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_EXTRACT_CHARS);
}

export function isPdfFile(file: { name: string; type: string }) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isTextFile(file: { name: string; type: string }) {
  return file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
}
