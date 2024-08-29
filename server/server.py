from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.docstore.document import Document
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
import fitz
import os
import json
import re
import torch

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
script_dir = os.path.dirname(os.path.abspath(__file__))
persist_directory = os.path.join(script_dir, 'chroma_db')

# Ensure CUDA is available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Initialize embeddings and vector store
embeddings = FastEmbedEmbeddings()
vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)

# FUNCTIONS
def extract_text_from_pdf(pdf_file):
    doc = fitz.open(stream=pdf_file.read(), filetype='pdf')
    text = ''
    for page in doc:
        text += page.get_text()
    # Remove blank spaces, periods, and other characters that are not needed for generating embeddings
    cleaned_text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return cleaned_text

def ollama_llm(question, context):
    formatted_prompt = f"Question: {question}\n\n Context: {context}"
    response = ollama.generate(model='tinyllama', prompt=formatted_prompt, stream=False, options={"num_gpu": 1, "temperature": 1, "main_gpu": 0, "low_vram": False})
    return response['response']

def combine_doc(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def rag_chain(question):
    if vectorstore is None:
        return "No vector store has been created. Please upload a file first."
    retriever = vectorstore.as_retriever()
    retrieved_doc = retriever.invoke(question + ' ' + 'You will be querying a document to find specific information. Please provide answers that are as close as possible to the text in the document. Keep the answers straight to the point and give me the answer and nothing else. If the answer is not available in the document, simply state "Information not available."')

    if not retrieved_doc:
        return "No similar data found. Please upload relevant documents."

    formatted_context = combine_doc(retrieved_doc)
    return ollama_llm(question, formatted_context)

def save_note(note):
    documents = [Document(page_content=note)]
    vectorstore.add_documents(documents)

@app.route('/uploadFile', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file:
        pdf_text = extract_text_from_pdf(file)
        print(f"Extracted text: {pdf_text[:500]}...")  # Print the first 500 characters for debugging
        text_chunker = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=50)
        chunked_text = text_chunker.split_text(pdf_text)
        documents = [Document(page_content=chunk) for chunk in chunked_text]

        vectorstore.add_documents(documents)
        return jsonify({'status': 'File uploaded and processed successfully'})

@app.route('/getQA', methods=['POST'])
def getQA():
    data = request.get_json()
    prompt = data.get('prompt')

    response = rag_chain(prompt)
    return jsonify({'response': response})

@app.route('/createNote', methods=['POST'])
def create_note():
    data = request.get_json()
    note = data.get('note')

    if note:
        save_note(note)
        return jsonify({'status': 'Note saved successfully'})
    else:
        return jsonify({'error': 'No note provided'})

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    question = data.get('question')

    if not question:
        return jsonify({'error': 'No question provided'})

    print(f"Received question: {question}")

    response = rag_chain(question)
    print(f"Generated response: {response}")

    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)