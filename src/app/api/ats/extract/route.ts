import { extractTextFromUpload } from "@/lib/pdf/extract-text";
import { MAX_UPLOAD_BYTES } from "@/lib/pdf/text";
import { enforceRateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await auth();
  const userKey = session?.user?.id || session?.user?.email || request.headers.get("x-forwarded-for") || "anon";
  const limit = await enforceRateLimit(`ats-extract:${userKey}`, Number(process.env.ATS_CHECK_LIMIT_PER_HOUR || 30));
  if (!limit.allowed) {
    return Response.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Upload a PDF using multipart form data." }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose a PDF or .txt file to extract." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "File is too large (max 8 MB)." }, { status: 400 });
  }

  try {
    const text = await extractTextFromUpload(file);
    return Response.json({ text, fileName: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read that file";
    return Response.json({ error: message }, { status: 422 });
  }
}
