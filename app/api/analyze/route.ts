import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { analyzeTranscript } from "../../lib/llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const extractedText = data.text?.trim();

    // Detect scanned PDFs
    if (!extractedText || extractedText.length < 100) {
      return NextResponse.json(
        {
          error: "SCANNED_PDF",
          message:
            "This PDF appears to be image-based or scanned. OCR processing would be required in production."
        },
        { status: 400 }
      );
    }

  const analysis = await analyzeTranscript(extractedText);

return NextResponse.json(analysis);


  } catch (error: any) {
    console.error("ERROR:", error.response?.data || error.message);

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
