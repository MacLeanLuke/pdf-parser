import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { eligibilityDocuments } from "@/db/schema";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SUMMARY_SNIPPET_LENGTH = 160;

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const sourceType = searchParams.get("sourceType");
    const query = searchParams.get("q")?.trim();

    const conditions = [];

    if (sourceType === "pdf" || sourceType === "web") {
      conditions.push(eq(eligibilityDocuments.sourceType, sourceType));
    }

    if (query) {
      const pattern = `%${query}%`;
      conditions.push(
        or(
          ilike(eligibilityDocuments.programName, pattern),
          ilike(eligibilityDocuments.pageTitle, pattern),
          ilike(eligibilityDocuments.sourceUrl, pattern),
        ),
      );
    }

    const baseQuery = db
      .select({
        id: eligibilityDocuments.id,
        programName: eligibilityDocuments.programName,
        sourceType: eligibilityDocuments.sourceType,
        sourceUrl: eligibilityDocuments.sourceUrl,
        pageTitle: eligibilityDocuments.pageTitle,
        createdAt: eligibilityDocuments.createdAt,
        rawEligibilityText: eligibilityDocuments.rawEligibilityText,
      })
      .from(eligibilityDocuments)
      .orderBy(desc(eligibilityDocuments.createdAt));

    const whereClause =
      conditions.length === 1
        ? conditions[0]
        : conditions.length > 1
          ? and(...conditions)
          : undefined;

    const records = await baseQuery.where(whereClause).limit(limit);

    const items = records.map(
      ({ rawEligibilityText, ...record }) => ({
        ...record,
        preview: createSnippet(rawEligibilityText, SUMMARY_SNIPPET_LENGTH),
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load eligibility records", error);
    return NextResponse.json(
      { error: "Failed to load eligibility records." },
      { status: 500 },
    );
  }
}

function createSnippet(text: string, maxLength: number) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}…`;
}
