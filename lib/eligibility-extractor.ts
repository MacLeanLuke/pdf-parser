import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { eligibilitySchema, eligibilitySystemPrompt } from "./eligibility-schema";

const MODEL_NAME = process.env.OPENAI_MODEL ?? "gpt-4.1";

export type EligibilitySourceType = "pdf" | "web";

type ExtractEligibilityOptions = {
  text: string;
  sourceType: EligibilitySourceType;
  metadata?: {
    fileName?: string | null;
    url?: string | null;
    title?: string | null;
  };
  maxCharacters?: number;
};

export async function extractEligibility(options: ExtractEligibilityOptions) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const sanitizedText = sanitizeText(
    options.text,
    options.maxCharacters ?? (options.sourceType === "web" ? 20_000 : 50_000),
  );

  const { object } = await generateObject({
    model: openai(MODEL_NAME),
    schema: eligibilitySchema,
    messages: [
      {
        role: "system",
        content: eligibilitySystemPrompt,
      },
      {
        role: "user",
        content: buildUserPrompt(options, sanitizedText),
      },
    ],
  });

  return object;
}

export async function extractEligibilityFromText(pdfText: string) {
  return extractEligibility({ text: pdfText, sourceType: "pdf" });
}

function buildUserPrompt(
  options: ExtractEligibilityOptions,
  sanitizedText: string,
) {
  const meta = formatMetadata(options);
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

function formatMetadata(options: ExtractEligibilityOptions) {
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

function sanitizeText(text: string, maxCharacters: number) {
  if (text.length <= maxCharacters) {
    return text;
  }

  return text.slice(0, maxCharacters);
}
