import { EventEmitter } from "node:events";
import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

type JobName = "compile" | "generate";
type JobPayload = Record<string, unknown>;

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

let redis: IORedis | null = null;
let queue: Queue | null = null;
const localJobs = new Map<string, JobPayload & { name: JobName }>();

function redisUrl() {
  return process.env.REDIS_URL?.trim() || "";
}

function getQueue() {
  const url = redisUrl();
  if (!url) return null;
  if (!queue) {
    redis = new IORedis(url, { maxRetriesPerRequest: null });
    queue = new Queue("resumeforge", { connection: redis });
  }
  return queue;
}

export function jobChannel(jobId: string) {
  return `job:${jobId}`;
}

export function onJobEvent(jobId: string, listener: (event: unknown) => void) {
  const channel = jobChannel(jobId);
  emitter.on(channel, listener);
  return () => emitter.off(channel, listener);
}

export function emitJobEvent(jobId: string, event: unknown) {
  emitter.emit(jobChannel(jobId), event);
}

export async function enqueueJob(name: JobName, jobId: string, payload: JobPayload, opts?: JobsOptions) {
  const q = getQueue();
  if (q) {
    await q.add(name, { jobId, ...payload }, { jobId, removeOnComplete: 50, removeOnFail: 50, ...opts });
    return;
  }
  localJobs.set(jobId, { name, jobId, ...payload });
}

export function consumeLocalJob(jobId: string) {
  const job = localJobs.get(jobId);
  localJobs.delete(jobId);
  return job;
}

export function createWorker(processor: (job: { name: string; data: JobPayload & { jobId: string } }) => Promise<void>) {
  const url = redisUrl();
  if (!url) return null;
  const connection = new IORedis(url, { maxRetriesPerRequest: null });
  return new Worker(
    "resumeforge",
    async (job) => {
      await processor({ name: job.name, data: job.data as JobPayload & { jobId: string } });
    },
    { connection },
  );
}
