import OpenAI from "openai";
import { coerceJdAnalysis, coerceRewriteResult, parseModelJson } from "@/lib/ai/parse";
import type { AIProvider } from "@/lib/ai/provider";
import { ANALYZE_SYSTEM_PROMPT, REWRITE_SYSTEM_PROMPT } from "@/lib/ai/provider";

function clientFor(kind: "openai" | "grok") {
  if (kind === "grok") {
    return new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: process.env.XAI_API_BASE || "https://api.x.ai/v1",
    });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function complete(client: OpenAI, model: string, system: string, user: string) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return completion.choices[0]?.message?.content ?? "{}";
}

export function createOpenAIProvider(): AIProvider {
  const client = clientFor("openai");
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  return {
    id: "openai",
    async analyzeJobDescription(jd) {
      return coerceJdAnalysis(parseModelJson(await complete(client, model, ANALYZE_SYSTEM_PROMPT, jd)));
    },
    async rewriteResume(input) {
      return coerceRewriteResult(
        parseModelJson(await complete(client, model, REWRITE_SYSTEM_PROMPT, JSON.stringify(input))),
        input.profile,
      );
    },
  };
}

export function createGrokProvider(): AIProvider {
  const client = clientFor("grok");
  const model = process.env.GROK_MODEL || "grok-2-latest";
  return {
    id: "grok",
    async analyzeJobDescription(jd) {
      return coerceJdAnalysis(parseModelJson(await complete(client, model, ANALYZE_SYSTEM_PROMPT, jd)));
    },
    async rewriteResume(input) {
      return coerceRewriteResult(
        parseModelJson(await complete(client, model, REWRITE_SYSTEM_PROMPT, JSON.stringify(input))),
        input.profile,
      );
    },
  };
}
