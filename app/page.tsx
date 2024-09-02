"use client";
import { useState } from "react";
import UploadInvoice from "./lib/UploadInvoice";
import EditInvoice from "./lib/editInvoice";
import DownloadPDF from "./lib/downloadPdf";

export default function Home() {
  const [invoiceData, setInvoiceData] = useState(null);
  const [modifiedUrl, setModifiedUrl] = useState(null);

  const handleUpload = (data) => {
    setInvoiceData(data);
  };

  const handleSave = async (editedComponents) => {
    const response = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editedComponents),
    });

    const result = await response.json();
    setModifiedUrl(result.downloadUrl);
  };

  return (
    <div>
      <h1>AI-Powered Invoice App</h1>
      {!invoiceData && <UploadInvoice onUpload={handleUpload} />}
      {invoiceData && !modifiedUrl && (
        <EditInvoice components={invoiceData} onSave={handleSave} />
      )}
      {modifiedUrl && <DownloadPDF downloadUrl={modifiedUrl} />}
    </div>
  );
}
