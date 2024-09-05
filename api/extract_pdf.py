import sys
import fitz  # PyMuPDF

def extract_pdf(filename):
    doc = fitz.open(f"uploads/{filename}")
    text = ""
    for page in doc:
        text += page.get_text()
    print(text)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_pdf.py <filename>")
        sys.exit(1)
    
    filename = sys.argv[1]
    extract_pdf(filename)
