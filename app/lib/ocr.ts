import { ocrSpace } from "ocr-space-api-wrapper";

const OCR_API_KEY = process.env.OCR_API_KEY;

export async function performOCR(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64Image = Buffer.from(buffer).toString("base64");

  try {
    const result = await ocrSpace(base64Image, { apiKey: OCR_API_KEY });
    console.log("OCR result:", result);

    return result.ParsedResults[0].ParsedText;
  } catch (error) {
    console.error("Error performing OCR:", error);
    throw new Error("Failed to perform OCR");
  }
}
