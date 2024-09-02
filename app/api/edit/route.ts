import { PDFDocument, rgb } from "pdf-lib";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  const editedComponents = req.body;

  // Load the original PDF (You should store and retrieve the original PDF based on your needs)
  // For simplicity, assuming a sample PDF is used
  const originalPdfPath = path.join(process.cwd(), "sample_invoice.pdf");
  const existingPdfBytes = fs.readFileSync(originalPdfPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Example: Update Invoice Number at a specific position
  if (editedComponents.key_values.InvoiceNumber) {
    firstPage.drawText(
      `Invoice Number: ${editedComponents.key_values.InvoiceNumber}`,
      {
        x: 50,
        y: height - 100,
        size: 12,
        color: rgb(0, 0, 0),
      }
    );
  }

  // Similarly, handle other fields based on their positions

  const modifiedPdfBytes = await pdfDoc.save();

  // Save the modified PDF to a temporary location or S3
  const fileName = `modified_invoice_${uuidv4()}.pdf`;
  const outputPath = path.join(
    process.cwd(),
    "public",
    "modified_pdfs",
    fileName
  );

  // Ensure the directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  fs.writeFileSync(outputPath, modifiedPdfBytes);

  // Generate a URL for the modified PDF
  const downloadUrl = `/modified_pdfs/${fileName}`;

  res.status(200).json({ downloadUrl });
}
