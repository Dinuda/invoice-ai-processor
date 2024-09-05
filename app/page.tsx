"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState(null);
  const [pdfContent, setPdfContent] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);
    try {
      const uploadResponse = await axios.post("/api/upload", formData);
      const { filename } = uploadResponse.data;
      await handleExtract(filename);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while uploading the file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async (filename) => {
    console.log("Extracting content from:", filename);

    try {
      const extractResponse = await axios.post("/api/extract", { filename });
      console.log("Extracted content:", extractResponse.data.text);

      setPdfContent(extractResponse.data.text);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while extracting the PDF content.");
    }
  };

  const handleEdit = async () => {
    if (!pdfContent) {
      alert("Please upload a PDF first!");
      return;
    }
    if (!editPrompt) {
      alert("Please enter an edit prompt!");
      return;
    }

    setIsLoading(true);
    try {
      const editResponse = await axios.post("/api/edit", {
        content: pdfContent,
        prompt: editPrompt,
      });
      setEditedContent(editResponse.data.editedContent);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while editing the content.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Editor with AI</h1>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf"
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mb-4"
      >
        {isLoading ? "Processing..." : "Upload and Extract"}
      </button>
      {pdfContent && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Original Content:</h2>
          <p className="whitespace-pre-wrap">{pdfContent}</p>
        </div>
      )}
      <div className="mb-4">
        <input
          type="text"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          placeholder="Enter edit prompt"
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleEdit}
          disabled={isLoading || !pdfContent}
          className="mt-2 bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? "Editing..." : "Edit with AI"}
        </button>
      </div>
      {editedContent && (
        <div>
          <h2 className="text-xl font-semibold">Edited Content:</h2>
          <p className="whitespace-pre-wrap">{editedContent}</p>
        </div>
      )}
    </div>
  );
}
