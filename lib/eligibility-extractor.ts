import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { eligibilitySchema, eligibilitySystemPrompt } from "./eligibility-schema";

const MODEL_NAME = process.env.OPENAI_MODEL ?? "gpt-4.1";

export async function extractEligibilityFromText(pdfText: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const sanitizedText = sanitizePdfText(pdfText);

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
        content: buildUserPrompt(sanitizedText),
      },
    ],
  });

  return object;
}

function buildUserPrompt(text: string) {
  return `You are given the raw text of a PDF that describes a program for homeless-services or housing support.
Your task is to extract eligibility information only using what is explicitly stated.

Return a JSON object that matches the provided schema. If a field is missing from the document, set it to null (for single values) or [] (for arrays). The rawEligibilityText should be the exact excerpt from the document that contains the eligibility rules.

PDF_TEXT:
"""
${text}
"""`;
}

const MAX_CHARACTERS = 50_000;

function sanitizePdfText(text: string) {
  if (text.length <= MAX_CHARACTERS) {
    return text;
  }

  return text.slice(0, MAX_CHARACTERS);
}
