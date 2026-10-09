import { renderToBuffer } from "@react-pdf/renderer";
import { ResumeDocument } from "@/lib/resume-doc/document";
import { resumePlainText } from "@/lib/resume-doc/plain-text";
import type { ResumeContent } from "@/lib/types";

export type RenderedResume = {
  pdf: Buffer;
  text: string;
};

/**
 * Server-side render of the exact component the editor previews.
 */
export async function renderResumePdf(options: {
  content: ResumeContent;
  templateSlug?: string | null;
  title?: string;
}): Promise<RenderedResume> {
  const pdf = await renderToBuffer(
    ResumeDocument({
      content: options.content,
      templateSlug: options.templateSlug,
      title: options.title,
    }),
  );
  return {
    pdf: Buffer.from(pdf),
    text: resumePlainText(options.content, options.templateSlug),
  };
}
