export default function DownloadPDF({ downloadUrl }) {
  return (
    <div>
      <a href={downloadUrl} download="modified_invoice.pdf">
        <button>Download Modified Invoice</button>
      </a>
    </div>
  );
}
