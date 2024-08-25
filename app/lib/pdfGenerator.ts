import PDFDocument from "pdfkit";
import { Invoice } from "@/types";

export function generatePDF(invoice: Invoice): Buffer {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];

  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {
    const pdfData = Buffer.concat(buffers);
    console.log(pdfData);
    // Here you would typically send or save the PDF
  });

  // Add content to the PDF
  doc.fontSize(18).text("INVOICE", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
  doc.text(`Invoice Date: ${invoice.invoiceDate}`);
  doc.text(`Customer Number: ${invoice.customerNumber}`);
  doc.text(`Order Number: ${invoice.orderNumber}`);
  doc.text(`Purchase Order: ${invoice.purchaseOrder}`);
  doc.text(`Currency: ${invoice.currency}`);

  doc.moveDown();
  doc.text("Billing Address:");
  doc.text(invoice.billingAddress);

  doc.moveDown();
  doc.text("Company Information:");
  doc.text(invoice.companyInfo);

  doc.moveDown();
  doc.text("Items:");
  invoice.items.forEach((item) => {
    doc.text(
      `${item.description} - Quantity: ${item.quantity}, Unit Price: ${item.unitPrice}, Total: ${item.total}`
    );
  });

  doc.moveDown();
  doc.text(`Net Amount: ${invoice.netAmount}`);
  doc.text(`Taxes: ${invoice.taxes}`);
  doc.text(`Grand Total: ${invoice.grandTotal}`);

  doc.moveDown();
  doc.text("Comments:");
  doc.text(invoice.comments);

  doc.end();

  return Buffer.concat(buffers);
}
