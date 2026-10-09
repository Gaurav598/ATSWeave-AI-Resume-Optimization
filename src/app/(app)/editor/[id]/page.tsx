import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ResumeEditor } from "@/components/editor/resume-editor";

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ templateId?: string; mode?: string; preview?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;

  // Legacy /editor/new?templateId=… used to hit this dynamic route and reuse a cached resume.
  if (id === "new") {
    const qs = new URLSearchParams();
    if (search.templateId) qs.set("templateId", search.templateId);
    if (search.mode) qs.set("mode", search.mode);
    redirect(`/editor/new${qs.toString() ? `?${qs}` : ""}`);
  }

  return (
    <Suspense fallback={<div className="p-10">Loading editor…</div>}>
      <ResumeEditor key={id} resumeId={id} />
    </Suspense>
  );
}
