export type EligibilitySourceType = "pdf" | "web";

export type EligibilityMetadata = {
  fileName?: string | null;
  url?: string | null;
  title?: string | null;
};

export type BaseExtractEligibilityOptions = {
  text: string;
  sourceType: EligibilitySourceType;
  metadata?: EligibilityMetadata;
  maxCharacters?: number;
};

export function sanitizeEligibilityText(text: string, maxCharacters: number) {
  if (text.length <= maxCharacters) {
    return text;
  }

  return text.slice(0, maxCharacters);
}

export function buildEligibilityUserPrompt(
  options: BaseExtractEligibilityOptions,
  sanitizedText: string,
) {
  const meta = formatEligibilityMetadata(options);
  const sourceLabel =
    options.sourceType === "pdf" ? "a PDF document" : "a website page";

  return `You are given text extracted from ${sourceLabel} describing a program for homeless-services or housing support.

Metadata:
${meta}

Return a JSON object that matches the provided schema. If a field is missing from the document, set it to null (for single values) or [] (for arrays). The rawEligibilityText should be the exact excerpt from the material that contains the eligibility rules.

SOURCE_TEXT:
"""
${sanitizedText}
"""`;
}

export function formatEligibilityMetadata(
  options: BaseExtractEligibilityOptions,
) {
  const parts: string[] = [
    `Source type: ${options.sourceType === "pdf" ? "PDF" : "Web page"}.`,
  ];

  if (options.metadata?.fileName) {
    parts.push(`File name: ${options.metadata.fileName}`);
  }

  if (options.metadata?.title) {
    parts.push(`Title: ${options.metadata.title}`);
  }

  if (options.metadata?.url) {
    parts.push(`URL: ${options.metadata.url}`);
  }

  if (parts.length === 0) {
    return "None provided.";
  }

  return parts.join("\n");
}
