import { redirect } from "next/navigation";
import { GenerateView } from "@/components/generate/generate-view";

export default async function GeneratePage({
  params,
  searchParams,
}: {
  params: Promise<{ resumeId: string }>;
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { resumeId } = await params;
  const { jobId } = await searchParams;
  // Without a job there is nothing to watch — the resume itself is the result.
  if (!jobId) redirect(`/editor/${resumeId}`);
  return <GenerateView resumeId={resumeId} jobId={jobId} />;
}
