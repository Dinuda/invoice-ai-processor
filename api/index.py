import sys
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from pdf2image import convert_from_path
from PIL import Image
from PyPDF2 import PdfReader, PdfWriter
from openai import AzureOpenAI
import tempfile
import fitz  # PyMuPDF

app = Flask(__name__)
client = AzureOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),  
    api_version="2023-05-15",
    azure_endpoint=os.getenv("OPENAI_AZURE_ENDPOINT")
)

model_name = "makers_gpt4o"

def extract_structure_from_pdf(pdf_path):
    structure = []
    with fitz.open(pdf_path) as doc:
        for page in doc:
            page_structure = []
            blocks = page.get_text("dict")["blocks"]
            for b in blocks:
                if b["type"] == 0:  # Text
                    for line in b["lines"]:
                        for span in line["spans"]:
                            page_structure.append({
                                "text": span["text"],
                                "bbox": span["bbox"],
                                "font": span["font"],
                                "size": span["size"],
                                "color": span["color"]
                            })
                elif b["type"] == 1:  # Image
                    page_structure.append({
                        "type": "image",
                        "bbox": b["bbox"]
                    })
            structure.append(page_structure)
    return structure

def process_text_with_ai(text, prompt):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that edits and improves text while preserving the original structure and format."},
            {"role": "user", "content": f"Please edit and improve the following text, focusing on filling in missing parts and adding necessary information. Preserve the original structure, format, and any existing content as much as possible:\n\n{text}\n\nChanges to make:\n{prompt}"},
        ]
    )
    return response.choices[0].message.content

def merge_edited_text_with_structure(structure, edited_text):
    edited_words = edited_text.split()
    word_index = 0
    
    for page in structure:
        for item in page:
            if item.get("type") == "image":
                continue
            
            if word_index < len(edited_words):
                # Check if the original text is a header, footer, or part of a table
                if item["size"] > 12 or item["color"] != (0, 0, 0):  # Assuming headers/footers have larger font or different color
                    continue  # Preserve original text
                
                # Check if it's part of a table (simplified check, may need improvement)
                if re.match(r'^\s*[\d.,]+\s*$', item["text"]):
                    continue  # Preserve original text if it looks like table data
                
                item["text"] = edited_words[word_index]
                word_index += 1
    
    return structure

def edit_pdf_content(input_pdf_path, output_pdf_path, structure):
    doc = fitz.open(input_pdf_path)
    for page_num, page in enumerate(doc):
        for item in structure[page_num]:
            if item.get("type") == "image":
                continue
            page.clean_contents(False)
            try:
                page.insert_text(
                    (item["bbox"][0], item["bbox"][1]),
                    item["text"],
                    fontname=item["font"],
                    fontsize=item["size"],
                    fontfile=None,
                    color=item["color"]
                )
            except Exception as e:
                print(f"Error inserting text: {e}")
                # Fallback to a basic insert_text call
                page.insert_text((item["bbox"][0], item["bbox"][1]), item["text"], fontsize=12, fontname="helv", fontfile=None, color=(0, 0, 0))
    
    doc.save(output_pdf_path)
    doc.close()

def edit_pdf(input_pdf_path, output_pdf_path, prompt):
    # Extract structure from PDF
    structure = extract_structure_from_pdf(input_pdf_path)
    
    # Extract original text
    original_text = " ".join([item["text"] for page in structure for item in page if "text" in item])
    
    # Process text with OpenAI
    edited_text = process_text_with_ai(original_text, prompt)
    
    # Merge edited text with original structure
    updated_structure = merge_edited_text_with_structure(structure, edited_text)
    
    # Edit PDF content while preserving structure
    edit_pdf_content(input_pdf_path, output_pdf_path, updated_structure)
    
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(file_path)
        return jsonify({"message": "File uploaded successfully", "file_path": file_path}), 200

@app.route('/api/extract', methods=['POST'])
def extract_invoice():
    data = request.get_json()
    if not data or 'file_path' not in data or 'prompt' not in data:
        return jsonify({"error": "No file path or prompt provided"}), 400
    
    input_pdf = data['file_path']
    output_pdf = os.path.join(tempfile.gettempdir(), "edited_invoice.pdf")
    prompt = data['prompt']
    
    edit_pdf(input_pdf, output_pdf, prompt)
    
    return jsonify({"message": "Invoice edited successfully", "output_path": output_pdf}), 200

if __name__ == '__main__':
    app.run(debug=True)