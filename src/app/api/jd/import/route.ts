import { load } from "cheerio";

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url?: string };
  if (!url) return Response.json({ error: "Missing URL" }, { status: 400 });
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json({ error: "Only http(s) URLs are allowed" }, { status: 400 });
    }
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 ATSWeave/1.0" },
      redirect: "follow",
    });
    if (!res.ok) {
      return Response.json(
        { error: "This job board blocked the import. Paste the description manually." },
        { status: 422 },
      );
    }
    const html = await res.text();
    const $ = load(html);
    $("script, style, nav, footer, noscript").remove();
    const text = ($("article").text() || $("main").text() || $("body").text())
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text.length < 80) {
      return Response.json(
        { error: "Could not extract a job description. Paste it manually." },
        { status: 422 },
      );
    }
    return Response.json({ text: text.slice(0, 20_000) });
  } catch {
    return Response.json(
      { error: "Import failed. Paste the job description manually." },
      { status: 422 },
    );
  }
}
