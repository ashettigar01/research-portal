import pdf from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  const extractedText = data.text?.trim();

  if (!extractedText || extractedText.length < 50) {
    throw new Error("SCANNED_PDF");
  }

  return extractedText;
}
