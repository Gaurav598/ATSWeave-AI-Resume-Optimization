import { signIn } from "next-auth/react";

export function safeCallback(url: string | null | undefined, fallback = "/gallery") {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return fallback;
  return url;
}

/** Rebuild /editor/new?... if the redirect URL was split across query params. */
export function continueUrlFromSearch(search: { get: (key: string) => string | null }, fallback = "/gallery") {
  const from = search.get("from");
  const templateId = search.get("templateId");
  if (from?.startsWith("/editor") && templateId && !from.includes("templateId=")) {
    const mode = search.get("mode") || "manual";
    const source = search.get("source") || "example";
    return `/editor/new?templateId=${encodeURIComponent(templateId)}&mode=${encodeURIComponent(mode)}&source=${encodeURIComponent(source)}`;
  }
  return safeCallback(from, fallback);
}

/**
 * Starts the only auth method that is actually configured. Calling `signIn("demo")`
 * when the demo provider is off looks like a successful click and then fails.
 */
export function startSignIn(options: {
  googleConfigured: boolean;
  demoConfigured: boolean;
  callbackUrl?: string;
}) {
  const callbackUrl = safeCallback(options.callbackUrl);
  if (options.demoConfigured) return signIn("demo", { callbackUrl });
  if (options.googleConfigured) return signIn("google", { callbackUrl });
  return Promise.resolve();
}

export function canSignIn(googleConfigured: boolean, demoConfigured: boolean) {
  return googleConfigured || demoConfigured;
}
