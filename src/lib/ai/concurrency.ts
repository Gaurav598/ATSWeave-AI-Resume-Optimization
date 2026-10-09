/** Simple in-process semaphore so ~1000 users don't stampede the AI provider. */
let active = 0;
const waiters: Array<() => void> = [];
const MAX = Number(process.env.AI_MAX_CONCURRENCY || 8);

export async function withAiConcurrency<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  active += 1;
  try {
    return await fn();
  } finally {
    active -= 1;
    const next = waiters.shift();
    if (next) next();
  }
}

export function aiConcurrencyStats() {
  return { active, waiting: waiters.length, max: MAX };
}
