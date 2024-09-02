import { useState } from "react";

export default function UploadInvoice({ onUpload }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("invoice", file);

    const response = await fetch("/api/upload", {
      // Ensure this matches your server endpoint
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    onUpload(data);
    setUploading(false);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Invoice"}
      </button>
    </div>
  );
}
