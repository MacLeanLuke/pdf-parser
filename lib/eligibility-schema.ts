import { z } from "zod";

export const populationOptions = [
  "single_adults",
  "families",
  "youth",
  "veterans",
  "seniors",
  "any",
] as const;

export const genderRestrictions = [
  "any",
  "women_only",
  "men_only",
  "non_male",
  "non_female",
] as const;

export const requirementOptions = [
  "sober",
  "id_required",
  "background_check",
  "income_limit",
  "must_be_resident",
  "must_be_veteran",
  "must_have_child",
] as const;

export const eligibilitySchema = z.object({
  programName: z
    .union([z.string().trim().min(1), z.null()])
    .transform((value) => (value === null ? null : value.trim()))
    .default(null),
  rawEligibilityText: z.string().min(1, "rawEligibilityText must include text"),
  population: z.array(z.enum(populationOptions)).default([]),
  genderRestriction: z
    .enum(genderRestrictions)
    .nullish()
    .transform((value): (typeof genderRestrictions)[number] => value ?? "any"),
  requirements: z.array(z.enum(requirementOptions)).default([]),
  locationConstraints: z.array(z.string().trim().min(1)).default([]),
  maxStayDays: z.number().int().nonnegative().nullable().default(null),
  ageRange: z
    .object({
      min: z.number().int().nonnegative().nullable().default(null),
      max: z.number().int().nonnegative().nullable().default(null),
    })
    .default({ min: null, max: null }),
  notes: z.string().default(""),
});

export type Eligibility = z.infer<typeof eligibilitySchema>;

export const eligibilitySystemPrompt = `You are an expert case manager who extracts structured eligibility rules from program PDFs related to homeless-services and housing assistance. Provided the raw PDF text, identify only directly-stated eligibility information. If any field is not explicitly mentioned, return null for single values or [] for arrays. For genderRestriction, use "any" when no restriction is stated. Do not infer details beyond what is present in the text. Provide the exact excerpt that states eligibility in rawEligibilityText.`;
