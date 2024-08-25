export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  customerNumber: string;
  orderNumber: string;
  purchaseOrder: string;
  currency: string;
  billingAddress: string;
  companyInfo: string;
  items: Array<{
    productNumber: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    netAmount: number;
    taxRate: string;
    taxes: number;
    total: number;
  }>;
  netAmount: number;
  taxes: number;
  grandTotal: number;
  comments: string;
}

export interface AISuggestions {
  changes: Partial<Invoice>;
  explanation: string;
}
