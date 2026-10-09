import { GoogleGenerativeAI } from "@google/generative-ai";
import { coerceJdAnalysis, coerceRewriteResult, parseModelJson } from "@/lib/ai/parse";
import type { AIProvider } from "@/lib/ai/provider";
import { ANALYZE_SYSTEM_PROMPT, REWRITE_SYSTEM_PROMPT } from "@/lib/ai/provider";

const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

function modelList() {
  const preferred = (process.env.GEMINI_MODEL || "").trim();
  return [...new Set([preferred, ...FALLBACK_MODELS].filter(Boolean))];
}

function isFatalAuthError(message: string) {
  return /API[_ ]?KEY|401|403|PERMISSION_DENIED|invalid x-goog-api-key|API key not valid/i.test(message);
}

function isUnavailableModel(message: string) {
  return /not found|404|NOT_FOUND|not supported|unknown model/i.test(message);
}

async function generateJson(genAI: GoogleGenerativeAI, system: string, user: string, temperature: number) {
  let lastError: Error | null = null;

  for (const modelName of modelList()) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: system,
        generationConfig: {
          responseMimeType: "application/json",
          temperature,
          maxOutputTokens: 8192,
        },
      });
      const result = await model.generateContent(user);
      const text = result.response.text();
      if (!text?.trim()) {
        throw new Error(`Gemini (${modelName}) returned an empty response`);
      }
      return parseModelJson<unknown>(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isFatalAuthError(message)) {
        throw new Error("Gemini API key is invalid. Check GEMINI_API_KEY in .env and restart the server.");
      }
      lastError = error instanceof Error ? error : new Error(message);
      if (!isUnavailableModel(message) && !/JSON|empty response/i.test(message)) {
        // Transient or parse issues: try the next model anyway.
      }
    }
  }

  throw lastError ?? new Error("Gemini request failed");
}

export function createGeminiProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    id: "gemini",
    async analyzeJobDescription(jd) {
      const raw = await generateJson(genAI, ANALYZE_SYSTEM_PROMPT, jd, 0.2);
      return coerceJdAnalysis(raw);
    },
    async rewriteResume(input) {
      const raw = await generateJson(genAI, REWRITE_SYSTEM_PROMPT, JSON.stringify(input), 0.3);
      return coerceRewriteResult(raw, input.profile);
    },
  };
}
