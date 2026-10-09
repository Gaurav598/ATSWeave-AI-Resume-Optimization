import { emitJobEvent, onJobEvent } from "@/lib/jobs/queue";

type Buffered = { events: unknown[]; touchedAt: number };

const buffers = new Map<string, Buffered>();
const BUFFER_TTL_MS = 30 * 60 * 1000;
const MAX_EVENTS_PER_JOB = 200;

function sweep() {
  const cutoff = Date.now() - BUFFER_TTL_MS;
  for (const [jobId, buffer] of buffers) {
    if (buffer.touchedAt < cutoff) buffers.delete(jobId);
  }
}

export function pushJobEvent(jobId: string, event: unknown) {
  const buffer = buffers.get(jobId) ?? { events: [], touchedAt: Date.now() };
  buffer.events.push(event);
  if (buffer.events.length > MAX_EVENTS_PER_JOB) {
    buffer.events.splice(0, buffer.events.length - MAX_EVENTS_PER_JOB);
  }
  buffer.touchedAt = Date.now();
  buffers.set(jobId, buffer);
  sweep();
  emitJobEvent(jobId, event);
}

export function getJobBuffer(jobId: string) {
  return buffers.get(jobId)?.events ?? [];
}

export { onJobEvent };
