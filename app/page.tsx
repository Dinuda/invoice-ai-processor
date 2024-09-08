"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUploadAndEdit = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    if (!editPrompt) {
      alert("Please enter an edit prompt!");
      return;
    }

    setIsLoading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await axios.post("/api/upload", formData);
      const { file_path } = uploadResponse.data;

      // Extract and edit
      const extractResponse = await axios.post("/api/extract", {
        file_path: file_path,
        prompt: editPrompt,
      });
      setOutputPath(extractResponse.data.output_path);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while processing the PDF.");
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
      <div className="mb-4">
        <input
          type="text"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          placeholder="Enter edit prompt"
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        onClick={handleUploadAndEdit}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mb-4"
      >
        {isLoading ? "Processing..." : "Upload and Edit PDF"}
      </button>
      {outputPath && (
        <div>
          <h2 className="text-xl font-semibold">Edited PDF:</h2>
          <p>Your edited PDF is available at: {outputPath}</p>
          <p>
            You can download it from the server or implement a download link
            here.
          </p>
        </div>
      )}
    </div>
  );
}
