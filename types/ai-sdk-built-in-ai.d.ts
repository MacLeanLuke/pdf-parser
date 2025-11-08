declare module "@ai-sdk/built-in-ai" {
  import type { LanguageModelV1 } from "ai";

  export function builtInAi(options?: { model?: string }): LanguageModelV1;
  const defaultExport: typeof builtInAi;
  export default defaultExport;
}
