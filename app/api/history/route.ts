import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { eligibilityDocuments } from "@/db/schema";

const HISTORY_LIMIT = 10;

export async function GET() {
  try {
    const items = await db
      .select({
        id: eligibilityDocuments.id,
        programName: eligibilityDocuments.programName,
        fileName: eligibilityDocuments.fileName,
        createdAt: eligibilityDocuments.createdAt,
        rawEligibilityText: eligibilityDocuments.rawEligibilityText,
        eligibilityJson: eligibilityDocuments.eligibilityJson,
        fileSize: eligibilityDocuments.fileSize,
        mimeType: eligibilityDocuments.mimeType,
      })
      .from(eligibilityDocuments)
      .orderBy(desc(eligibilityDocuments.createdAt))
      .limit(HISTORY_LIMIT);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load history", error);
    return NextResponse.json(
      { error: "Failed to load history." },
      { status: 500 }
    );
  }
}
