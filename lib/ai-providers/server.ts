import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

type ServerProviderOptions = {
  fallbackModel?: string;
};

export type ServerAiProvider = {
  readonly defaultModel: string;
  ensureConfigured: () => void;
  generateObject: typeof generateObject;
  getModel: (modelName?: string | null) => ReturnType<typeof openai>;
};

export function createServerAiProvider(
  options: ServerProviderOptions = {},
): ServerAiProvider {
  const fallbackModel = options.fallbackModel ?? "gpt-4.1-mini";

  const ensureConfigured = () => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
  };

  const getModel = (modelName?: string | null) => {
    const resolved = modelName?.trim() || fallbackModel;
    return openai(resolved);
  };

  return {
    defaultModel: fallbackModel,
    ensureConfigured,
    generateObject,
    getModel,
  };
}
