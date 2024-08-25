"use client";

import { useState, FormEvent } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("invoice", file);
    if (prompt) formData.append("prompt", prompt);

    try {
      const response = await fetch("/api/process-invoice", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "updated_invoice.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        throw new Error("Failed to process invoice");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while processing the invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Invoice Processor</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="invoice" className="block mb-2">
            Upload Invoice:
          </label>
          <input
            type="file"
            id="invoice"
            accept=".pdf,.jpg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
        </div>
        <div>
          <label htmlFor="prompt" className="block mb-2">
            AI Prompt (optional):
          </label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter AI prompt here"
          />
        </div>
        <button
          type="submit"
          disabled={!file || loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Process Invoice"}
        </button>
      </form>
    </main>
  );
}
