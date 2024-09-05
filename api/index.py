import sys
# app.py
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import fitz  # PyMuPDF
from transformers import pipeline

app = Flask(__name__)


# Configure upload folder
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize AI model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({"message": "File uploaded successfully", "filename": filename}), 200
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/process', methods=['POST'])
def process_pdf():
    filename = request.json.get('filename')
    if not filename:
        return jsonify({"error": "No filename provided"}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404

    # Extract text from PDF
    doc = fitz.open(filepath)
    text = ""
    for page in doc:
        text += page.get_text()

    # Process text with AI
    summary = summarizer(text, max_length=150, min_length=30, do_sample=False)[0]['summary_text']

    return jsonify({"summary": summary}), 200

if __name__ == '__main__':
    app.run(debug=True)
    

@app.route('/api/edit', methods=['POST'])
def edit_content():
    data = request.get_json()
    
    # Ensure filename and prompt are provided in the JSON body
    if not data or 'content' not in data or 'prompt' not in data:
        return jsonify({"error": "No content or prompt provided"}), 400
    
    content = data['content']
    prompt = data['prompt']
    
    # Initialize AI model
    editor = pipeline("text2text-generation", model="facebook/bart-large-cnn")

    # Prepare the input for the model
    input_text = f"Edit the following text based on this instruction: {prompt}\n\nText: {content}"

    # Generate edited content
    edited = editor(input_text, max_length=1024, min_length=30, do_sample=True)[0]['generated_text']

    print(edited)
    
    return jsonify({"edited": edited}), 200
    
@app.route('/api/extract', methods=['POST'])
def extract_pdf():
    data = request.get_json()

    # Ensure filename is provided in the JSON body
    if not data or 'filename' not in data:
        return jsonify({"error": "No filename provided"}), 400

    filename = data['filename']
    file_path = os.path.join("uploads", filename)

    # Check if the file exists
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        # Open the file using PyMuPDF
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()

        # Return the extracted text as a JSON response
        return jsonify({"text": text}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_pdf.py <filename>")
        sys.exit(1)
    
    filename = sys.argv[1]
    extract_pdf(filename)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python edit_content.py <filename> <prompt>")
        sys.exit(1)
    
    filename = sys.argv[1]
    prompt = sys.argv[2]
    edit_content(filename, prompt)