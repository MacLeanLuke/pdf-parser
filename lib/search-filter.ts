import { z } from "zod";

export const searchFilterSchema = z.object({
  textQuery: z.string().max(200).default(""),
  populations: z.array(z.string().trim().min(1)).default([]),
  genderRestriction: z.string().trim().min(1).nullable().optional(),
  locations: z.array(z.string().trim().min(1)).default([]),
  requirementsInclude: z.array(z.string().trim().min(1)).default([]),
});

export type SearchFilter = z.infer<typeof searchFilterSchema>;

export const searchInterpretationPrompt = `You are an assistant helping caseworkers find eligibility information for homeless-services and housing programs. The user provides a natural language query describing who they are trying to help. Extract the key search filters:

- textQuery: a concise text phrase capturing the main concept (city, program type, etc.)
- populations: array of population keywords (single adults, families, youth, veterans, seniors, women, men, etc.)
- genderRestriction: if the user implies a gender restriction, choose one of: any, women_only, men_only, non_male, non_female.
- locations: list of geographic hints (city, county, state).
- requirementsInclude: array of important requirements or conditions (e.g., "low barrier", "no sobriety requirement", "accepts teen boys", "income limit").

If the user does not mention a field, leave it empty (for arrays) or null (for genderRestriction). Base everything only on the query text.`;
