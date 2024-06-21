import os
import torch
import fitz
from flask import Flask, request, jsonify
from docx import Document
from transformers import AutoTokenizer, AutoModel
from sklearn.feature_extraction.text import CountVectorizer
from chromadb import Client
from flask_cors import CORS
from chromadb.config import Settings
from langchain.vectorstores import Chroma
from langchain.embeddings.base import Embeddings
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)

class CustomEmbeddings(Embeddings):
    def __init__(self, embeddings):
        self.embeddings = embeddings

    def embed_documents(self, texts):
        return self.embeddings

    def embed_query(self, text):
        return self.embeddings[0]

# Check if GPU is available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Load the GPU-enabled embedder
model_name = "sentence-transformers/all-MiniLM-L6-v2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)
model.to(device)

# Initialize the Chroma DB client
client = Client(Settings(persist_directory="/server/chroma_db"))

def extract_text(file):
    # Extract text from PDF file
    if file.filename.endswith('.pdf'):
        doc = fitz.open(stream=file.read(), filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    # Extract text from TXT file
    elif file.filename.endswith('.txt'):
        return file.read().decode('utf-8')

    # Extract text from DOC file
    elif file.filename.endswith('.doc') or file.filename.endswith('.docx'):
        doc = Document(file)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text

def split_text(text):
    # Use a simple text splitter that splits the text into chunks of 1000 characters
    return [text[i:i+1000] for i in range(0, len(text), 1000)]

def generate_embeddings(chunks):
    # Generate embeddings for the chunks using the GPU-enabled embedder
    inputs = tokenizer(chunks, padding=True, truncation=True, return_tensors="pt")
    inputs.to(device)
    outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1).detach().cpu().numpy()
    return embeddings.tolist()

@app.route('/ingest', methods=['POST'])
def ingest():
    # Check if a file was uploaded
    if 'file' not in request.files:
        return "No file uploaded", 400

    file = request.files['file']

    # Check if the file has an allowed extension
    allowed_extensions = {'pdf', 'txt', 'doc', 'docx'}
    if '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions:
        # Extract the text from the file
        text = extract_text(file)

        # Split the text into chunks
        chunks = split_text(text)

        # Create embeddings for the chunks
        model = SentenceTransformer("all-MiniLM-L6-v2", device="cuda" if torch.cuda.is_available() else "cpu")
        embeddings = model.encode(chunks)

        # Create a vector store and persist the data in a directory
        vector_store = Chroma.from_texts(chunks, embeddings, persist_directory="./server/chroma_db")
        vector_store.persist()

        return "File uploaded and processed successfully", 200
    else:
        return "Invalid file type", 400

@app.route('/documents', methods=['GET'])
def get_documents():
    # Load the vector store from the persisted directory
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cuda" if torch.cuda.is_available() else "cpu")
    embedding_function = model
    vector_store = Chroma(persist_directory="./server/chroma_db", embedding_function=embedding_function)

    # Retrieve all the documents in the vector store
    documents = vector_store.get()

    # Return the documents as a JSON response
    return jsonify(documents)

if __name__ == '__main__':
    app.run(debug=True)
