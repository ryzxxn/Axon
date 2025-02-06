from langchain_community.vectorstores import Chroma #type: ignore
from langchain_community.embeddings import FastEmbedEmbeddings #type: ignore
from langchain.chains import RetrievalQA #type: ignore
from langchain.text_splitter import RecursiveCharacterTextSplitter #type: ignore
from langchain_groq import ChatGroq #type: ignore
from fastapi import APIRouter, File, HTTPException, Depends, UploadFile
from io import BytesIO
import fitz  # PyMuPDF for PDFs #type: ignore
from docx import Document #type: ignore
from dotenv import load_dotenv
from pydantic import BaseModel
from utils.logger import logger
import chromadb #type: ignore
from langchain_community.embeddings.sentence_transformer import ( SentenceTransformerEmbeddings ) #type: ignore

# Load environment variables from .env file
load_dotenv()

router = APIRouter()

# Initialize embeddings and vector store
# embeddings = FastEmbedEmbeddings()
persistence_directory = "./chroma_db"
chromaclient = chromadb.EphemeralClient()
embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
collection_name = "axon-video"
vector_store = Chroma(embedding_function=embedding_function, persist_directory=persistence_directory, collection_name=collection_name)

# Initialize text splitter and retriever
text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
retriever = vector_store.as_retriever(search_type="similarity_score_threshold", search_kwargs={"score_threshold": 0.5})

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.0, max_retries=2)
qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)

def clean_text(text):
    """Remove null characters from the text."""
    return text.replace('\x00', '')

class IngestVideoRequest(BaseModel):
    user_id: str
    video_id: str
    transcript: str

class IngestFileRequest(BaseModel):
    user_id: str

class QueryVideoRequest(BaseModel):
    video_id: str
    query: str

@router.post("/ingestVideo")
async def ingest_video(request: IngestVideoRequest):
    user_id = request.user_id
    video_id = request.video_id
    transcript = request.transcript

    # Log the input
    logger.info(f"Ingesting video with user_id: {user_id}, video_id: {video_id}, transcript: {transcript}")

    # Clean the text
    text = clean_text(transcript)

    # Split text into chunks
    chunks = text_splitter.split_text(text)

    # Embed and store chunks in the vector store
    for chunk in chunks:
        vector_store.add_texts([chunk], metadatas=[{"user_id": user_id, "video_id": video_id}])

    # Persist the vector store to the directory
    vector_store.persist()
    return {"status": "success"}

@router.post("/ingestFile")
async def ingest_file(file: UploadFile = File(...), request: IngestFileRequest = Depends()):
    user_id = request.user_id

    # Validate that a file has been uploaded
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # Get file type
    content_type = file.content_type

    # Extract content based on file type
    try:
        if content_type == "text/plain":
            content = await file.read()
            text = content.decode("utf-8")
        elif content_type == "application/pdf":
            text = extract_pdf(file)
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            text = extract_docx(file)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    # Clean the text
    text = clean_text(text)

    # Split text into chunks
    chunks = text_splitter.split_text(text)

    # Embed and store chunks in the vector store
    for chunk in chunks:
        vector_store.add_texts([chunk], metadatas=[{"user_id": user_id}])

    # Persist the vector store to the directory
    vector_store.persist()

    return {"file_name": file.filename, "content": text}

def extract_pdf(file: UploadFile) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    pdf_data = file.file.read()
    pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
    text = ""
    for page in pdf_document:
        text += page.get_text()
    pdf_document.close()
    if not text:
        raise HTTPException(status_code=500, detail="Error extracting text from PDF.")
    return text

def extract_docx(file: UploadFile) -> str:
    """Extract text from a DOCX file using python-docx."""
    doc_data = BytesIO(file.file.read())
    document = Document(doc_data)
    text = "\n".join([para.text for para in document.paragraphs])
    return text

@router.post("/queryVideo")
async def query_video(request: QueryVideoRequest):
    video_id = request.video_id
    query = request.query

    # Retrieve relevant documents for the user
    docs = vector_store.similarity_search(query)

    # return docs
    prompt= "Write a higly-detailed response that only includes all information information:"

    logger.info(f'{docs}')

    if docs is None:
        return {'response': "I don't know."}
    else:
        content = " ".join([doc.page_content for doc in docs])

        # Generate response using the QA chain
        response = qa_chain.invoke(prompt+content)
        if response:
            return {"response": response}

        # Handle cases where the QA chain returns an empty response
        if not response or response.strip() == "":
            return {"response": "No data available."}