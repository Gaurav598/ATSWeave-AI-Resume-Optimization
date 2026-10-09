import { MatchForm } from "@/components/match/match-form";

export default async function MatchPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  return <MatchForm templateId={templateId} />;
}
