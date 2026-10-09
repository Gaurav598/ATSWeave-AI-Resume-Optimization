import { enrichCodingProfiles } from "@/lib/coding-stats";
import { requireUser, apiError } from "@/lib/session";
import type { CodingProfiles } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireUser();
    const profiles = (await request.json()) as CodingProfiles;
    const { profiles: enriched, outcomes } = await enrichCodingProfiles(profiles);
    return Response.json({ codingProfiles: enriched, outcomes });
  } catch (error) {
    return apiError(error);
  }
}
