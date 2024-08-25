import { NextRequest, NextResponse } from "next/server";
import { recognizeInvoice } from "@/app/lib/invoiceRecognition";
import { generatePDF } from "@/app/lib/pdfGenerator";
import { applyChanges } from "@/app/lib/aiSuggestions";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get("invoice") as unknown as File;
  const aiPrompt: string | null = data.get("prompt") as string | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: "No file uploaded" },
      { status: 400 }
    );
  }

  try {
    let invoice = await recognizeInvoice(file);

    if (aiPrompt) {
      const suggestions = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt, invoice }),
      }).then((res) => res.json());
      invoice = applyChanges(invoice, suggestions.changes);
    }

    const pdfBuffer = generatePDF(invoice);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="updated_invoice.pdf"',
      },
    });
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { success: false, error: "Error processing invoice" },
      { status: 500 }
    );
  }
}
