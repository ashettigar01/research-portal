import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { analyzeTranscript } from "../../lib/llm";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 8000; // ✅ SAFE LIMIT FOR VERCEL

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer);
    let extractedText = data.text?.trim();

    if (!extractedText || extractedText.length < 150) {
      return NextResponse.json(
        { error: "SCANNED_PDF" },
        { status: 400 }
      );
    }

    // ✅ HARD LIMIT TEXT SIZE FOR PRODUCTION
    if (extractedText.length > MAX_TEXT_LENGTH) {
      extractedText = extractedText.slice(0, MAX_TEXT_LENGTH);
    }

    const analysis = await analyzeTranscript(extractedText);

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
