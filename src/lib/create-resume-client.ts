/** Dedupe Strict-Mode double mounts so /editor/new does not create two resumes. */
const inflight = new Map<string, Promise<{ id: string }>>();

export async function createResumeClient(
  templateId: string,
  mode = "manual",
  source = "example",
) {
  const key = `${templateId}:${mode}:${source}`;
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = fetch("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId, mode, source }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        throw new Error(data.error || "Failed to create resume");
      }
      return { id: data.id };
    })
    .finally(() => {
      window.setTimeout(() => inflight.delete(key), 2500);
    });

  inflight.set(key, promise);
  return promise;
}
