import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { analyzeTranscript } from "../../lib/llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    /* ---------- Convert File to Buffer ---------- */
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    /* ---------- Extract PDF Text ---------- */
    const data = await pdf(buffer);
    const extractedText = data.text?.trim();

    /* ---------- Detect Scanned / Image PDFs ---------- */
    if (!extractedText || extractedText.length < 150) {
      return NextResponse.json(
        {
          error: "SCANNED_PDF",
          message:
            "This PDF appears to be image-based or scanned. OCR would be required in production. Only text-based PDFs are supported."
        },
        { status: 400 }
      );
    }

    /* ---------- Run AI Analysis ---------- */
    const analysis = await analyzeTranscript(extractedText);

    /* ---------- AI Validation Layer ---------- */
    const missingCount = Object.values(analysis).filter(
      (val: any) => val === "Not mentioned"
    ).length;

    if (missingCount > 8) {
      analysis.ai_validation_warning =
        "Large portion of transcript lacked structured financial signals. Manual review recommended.";
    }

    const endTime = Date.now();

    /* ---------- Return Structured Response + Metadata ---------- */
    return NextResponse.json({
      ...analysis,
      metadata: {
        file_name: file.name,
        file_size_kb: Math.round(file.size / 1024),
        model_used: "llama-3.1-8b-instant",
        processing_time_ms: endTime - startTime,
        tool_version: "v1.0"
      }
    });

  } catch (error: any) {
    console.error("API ERROR:", error);

    if (error.message?.includes("Rate limit")) {
      return NextResponse.json(
        { error: "Rate limit reached. Please try again in 30 seconds." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          error.response?.data?.error?.message ||
          error.message ||
          "Unexpected server error"
      },
      { status: 500 }
    );
  }
}
