import sys
from transformers import pipeline

def edit_content(filename, prompt):
    with open(filename, 'r') as file:
        content = file.read()

    # Initialize AI model
    editor = pipeline("text2text-generation", model="facebook/bart-large-cnn")

    # Prepare the input for the model
    input_text = f"Edit the following text based on this instruction: {prompt}\n\nText: {content}"

    # Generate edited content
    edited = editor(input_text, max_length=1024, min_length=30, do_sample=True)[0]['generated_text']

    print(edited)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python edit_content.py <filename> <prompt>")
        sys.exit(1)
    
    filename = sys.argv[1]
    prompt = sys.argv[2]
    edit_content(filename, prompt)