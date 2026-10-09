import { MAX_PDF_PAGES, MAX_UPLOAD_BYTES, isPdfFile, isTextFile, normalizeExtractedText } from "@/lib/pdf/text";

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new Error(`PDF has too many pages (max ${MAX_PDF_PAGES})`);
  }
  const result = await extractText(pdf, { mergePages: true });
  return normalizeExtractedText(result.text);
}

export async function extractTextFromUpload(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large (max 8 MB)");
  }
  if (isTextFile(file)) {
    return normalizeExtractedText(await file.text());
  }
  if (isPdfFile(file)) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = await extractPdfText(bytes);
    if (text.length < 40) {
      throw new Error(
        "No readable text in that PDF. If it is a scanned image, paste the text instead.",
      );
    }
    return text;
  }
  throw new Error("Please upload a PDF or a .txt file.");
}
