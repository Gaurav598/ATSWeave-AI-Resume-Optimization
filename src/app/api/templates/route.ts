import { listPublishedTemplates } from "@/lib/templates";

export async function GET() {
  const templates = await listPublishedTemplates();
  return Response.json(templates);
}
