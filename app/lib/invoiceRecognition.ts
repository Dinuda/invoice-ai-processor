import fs from "fs";
import pdf from "pdf-parse";
import sharp from "sharp";
import * as tf from "@tensorflow/tfjs-node";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { Invoice } from "@/app/types";

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  // Convert image to grayscale and increase contrast
  const image = await sharp(buffer).greyscale().normalize().toBuffer();

  // Load the COCO-SSD model
  const model = await cocoSsd.load();

  // Convert the image buffer to a tensor
  const tensor = tf.node.decodeImage(image);

  // Run object detection
  const predictions = await model.detect(tensor as any);

  // Extract text from detected objects (assuming text is detected as objects)
  let extractedText = "";
  for (const prediction of predictions) {
    if (prediction.class === "text") {
      // Here you would ideally use OCR on the specific region
      // For simplicity, we're just noting that text was detected
      extractedText += `Text detected at: ${prediction.bbox.join(", ")}\n`;
    }
  }

  return extractedText;
}

export async function recognizeInvoice(file: File): Promise<Invoice> {
  const buffer = await file.arrayBuffer();
  let text: string;

  if (file.type === "application/pdf") {
    text = await extractTextFromPDF(Buffer.from(buffer));
  } else {
    text = await extractTextFromImage(Buffer.from(buffer));
  }

  // Now parse the text to extract invoice information
  // This is a simplified example - you'll need to adjust based on your invoice format
  const invoice: Invoice = {
    invoiceNumber: text.match(/Invoice Number:\s*(\w+)/)?.[1] || "",
    invoiceDate: text.match(/Date:\s*(\d{2}\/\d{2}\/\d{4})/)?.[1] || "",
    customerNumber: text.match(/Customer Number:\s*(\w+)/)?.[1] || "",
    // ... extract other fields similarly
    items: [],
    netAmount: parseFloat(text.match(/Net Amount:\s*(\d+\.\d{2})/)?.[1] || "0"),
    taxes: parseFloat(text.match(/Taxes:\s*(\d+\.\d{2})/)?.[1] || "0"),
    grandTotal: parseFloat(
      text.match(/Grand Total:\s*(\d+\.\d{2})/)?.[1] || "0"
    ),
  };

  // Extract items (this is a simplified version)
  const itemRegex = /(\d+)\s+([\w\s]+)\s+(\d+)\s+(\d+\.\d{2})\s+(\d+\.\d{2})/g;
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    invoice.items.push({
      quantity: parseInt(match[1]),
      description: match[2],
      unitPrice: parseFloat(match[4]),
      total: parseFloat(match[5]),
    });
  }

  return invoice;
}
