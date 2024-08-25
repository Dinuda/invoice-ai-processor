import { Invoice } from "@/types";

export function extractInvoiceData(text: string): Invoice {
  const invoice: Invoice = {
    invoiceNumber: "",
    invoiceDate: "",
    customerNumber: "",
    orderNumber: "",
    purchaseOrder: "",
    currency: "",
    billingAddress: "",
    companyInfo: "",
    items: [],
    netAmount: 0,
    taxes: 0,
    grandTotal: 0,
    comments: "",
  };

  // Extract invoice number
  const invoiceNumberMatch = text.match(/Invoice Number\s*(\w+)/);
  if (invoiceNumberMatch) invoice.invoiceNumber = invoiceNumberMatch[1];

  // Extract invoice date
  const invoiceDateMatch = text.match(/Invoice Date\s*(\d{2}-\w{3}-\d{4})/);
  if (invoiceDateMatch) invoice.invoiceDate = invoiceDateMatch[1];

  // Extract customer number
  const customerNumberMatch = text.match(/Customer Number\s*(\d+)/);
  if (customerNumberMatch) invoice.customerNumber = customerNumberMatch[1];

  // Extract order number
  const orderNumberMatch = text.match(/Order Number\s*(\d+)/);
  if (orderNumberMatch) invoice.orderNumber = orderNumberMatch[1];

  // Extract purchase order
  const purchaseOrderMatch = text.match(/Purchase Order\s*(\w+)/);
  if (purchaseOrderMatch) invoice.purchaseOrder = purchaseOrderMatch[1];

  // Extract currency
  const currencyMatch = text.match(/Currency\s*(\w+)/);
  if (currencyMatch) invoice.currency = currencyMatch[1];

  // Extract billing address
  const billingAddressMatch = text.match(/Bill To\s*([\s\S]*?)INVOICE/);
  if (billingAddressMatch)
    invoice.billingAddress = billingAddressMatch[1].trim();

  // Extract company info
  const companyInfoMatch = text.match(
    /Adobe Systems Software Ireland Ltd([\s\S]*?)Page 1 of 1/
  );
  if (companyInfoMatch) invoice.companyInfo = companyInfoMatch[1].trim();

  // Extract items
  const itemRegex =
    /(\d+)\s+([\w\s]+)\s+(\d+)\s+(\w+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+%)\s+([\d.]+)\s+([\d.]+)/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(text)) !== null) {
    invoice.items.push({
      productNumber: itemMatch[1],
      description: itemMatch[2],
      quantity: parseInt(itemMatch[3]),
      unit: itemMatch[4],
      unitPrice: parseFloat(itemMatch[5]),
      netAmount: parseFloat(itemMatch[6]),
      taxRate: itemMatch[7],
      taxes: parseFloat(itemMatch[8]),
      total: parseFloat(itemMatch[9]),
    });
  }

  // Extract totals
  const netAmountMatch = text.match(/NET AMOUNT \(USD\)\s*([\d.]+)/);
  if (netAmountMatch) invoice.netAmount = parseFloat(netAmountMatch[1]);

  const taxesMatch = text.match(/TAXES \(SEE DETAILS FOR RATES\)\s*([\d.]+)/);
  if (taxesMatch) invoice.taxes = parseFloat(taxesMatch[1]);

  const grandTotalMatch = text.match(/GRAND TOTAL \(USD\)\s*([\d.]+)/);
  if (grandTotalMatch) invoice.grandTotal = parseFloat(grandTotalMatch[1]);

  // Extract comments
  const commentsMatch = text.match(/Comments:([\s\S]*?)Note:/);
  if (commentsMatch) invoice.comments = commentsMatch[1].trim();

  return invoice;
}
