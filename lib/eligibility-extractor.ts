import { eligibilitySchema, eligibilitySystemPrompt } from "./eligibility-schema";
import {
  buildEligibilityUserPrompt,
  sanitizeEligibilityText,
  type BaseExtractEligibilityOptions,
  type EligibilitySourceType,
} from "./eligibility-shared";
import { createServerAiProvider } from "./ai-providers";

export type { EligibilitySourceType } from "./eligibility-shared";

const serverAi = createServerAiProvider({ fallbackModel: "gpt-4.1" });

const MODEL_NAME =
  (process.env.OPENAI_MODEL && process.env.OPENAI_MODEL.trim()) ||
  serverAi.defaultModel;

type ExtractEligibilityOptions = BaseExtractEligibilityOptions;

export async function extractEligibility(options: ExtractEligibilityOptions) {
  serverAi.ensureConfigured();

  const sanitizedText = sanitizeEligibilityText(
    options.text,
    options.maxCharacters ?? (options.sourceType === "web" ? 20_000 : 50_000),
  );

  const { object } = await serverAi.generateObject({
    model: serverAi.getModel(MODEL_NAME),
    schema: eligibilitySchema,
    messages: [
      {
        role: "system",
        content: eligibilitySystemPrompt,
      },
      {
        role: "user",
        content: buildEligibilityUserPrompt(options, sanitizedText),
      },
    ],
  });

  return object;
}

export async function extractEligibilityFromText(pdfText: string) {
  return extractEligibility({ text: pdfText, sourceType: "pdf" });
}
