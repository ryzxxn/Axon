from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter #type: ignore
from langchain.embeddings import SentenceTransformerEmbeddings #type: ignore
from langchain_groq import ChatGroq #type: ignore
import chromadb #type: ignore
import os
import fitz  # PyMuPDF #type: ignore
from docx import Document #type: ignore
from io import BytesIO
from utils.logger import logger
import uuid
import re
import json

# Load environment variables
load_dotenv()

router = APIRouter()

def extract_json(response_body: str):
    try:
        # Regex to find JSON enclosed within triple backticks or directly in the response
        match = re.search(r'```json\n(.*?)\n```', response_body, re.DOTALL)
        json_text = match.group(1) if match else response_body

        # Parse the extracted JSON
        return json.loads(json_text)
    except (json.JSONDecodeError, AttributeError):
        return None  # Return None if JSON extraction fails

# Initialize ChromaDB with persistence
persistence_directory = "./chroma_db"
chroma_client = chromadb.PersistentClient(path=persistence_directory)

collection_name = "axon-video"
collection = chroma_client.get_or_create_collection(name=collection_name)

# Initialize embedding function
embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

# Initialize text splitter
text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)

# Initialize LLM
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.0, max_retries=2)
# llm = ChatGroq(model="deepseek-r1-distill-qwen-32b", temperature=0.0, max_retries=2)



def clean_text(text: str) -> str:
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
    transcript = clean_text(request.transcript)

    # Split text into chunks
    chunks = text_splitter.split_text(transcript)

    # Generate embeddings
    embeddings = embedding_function.embed_documents(chunks)

    # Generate unique IDs
    ids = [str(uuid.uuid4()) for _ in chunks]

    # Store in ChromaDB
    collection.upsert(
        documents=chunks,
        metadatas=[{"user_id": user_id, "video_id": video_id} for _ in chunks],
        ids=ids,
        embeddings=embeddings
    )

    logger.info(f'Ingested {len(chunks)} document chunks for video {video_id}')
    return {"status": "success"}

@router.post("/ingestFile")
async def ingest_file(file: UploadFile = File(...), request: IngestFileRequest = Depends()):
    user_id = request.user_id

    # Validate uploaded file
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # Extract content based on file type
    content_type = file.content_type
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

    text = clean_text(text)

    # Split text into chunks
    chunks = text_splitter.split_text(text)

    # Generate embeddings
    embeddings = embedding_function.embed_documents(chunks)

    # Generate unique IDs
    ids = [str(uuid.uuid4()) for _ in chunks]

    # Store in ChromaDB
    collection.upsert(
        documents=chunks,
        metadatas=[{"user_id": user_id} for _ in chunks],
        ids=ids,
        embeddings=embeddings
    )

    return {"file_name": file.filename, "content": text}

def extract_pdf(file: UploadFile) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    pdf_data = file.file.read()
    pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
    text = "\n".join([page.get_text() for page in pdf_document])
    pdf_document.close()
    if not text:
        raise HTTPException(status_code=500, detail="Error extracting text from PDF.")
    return text

def extract_docx(file: UploadFile) -> str:
    """Extract text from a DOCX file using python-docx."""
    doc_data = BytesIO(file.file.read())
    document = Document(doc_data)
    return "\n".join([para.text for para in document.paragraphs])

@router.post("/queryVideo")
async def query_video(request: QueryVideoRequest):
    video_id = request.video_id
    query = request.query

    # Embed query
    embedded_query = embedding_function.embed_query(query)

    # Retrieve documents from ChromaDB
    results = collection.query(
        query_embeddings=[embedded_query],
        n_results=20,
        where={"video_id": video_id},
    )

    logger.info(results)

    if not results["documents"]:
        return {"response": "No relevant documents found."}

    # Concatenate retrieved documents
    context = " ".join(results["documents"][0])

    logger.info(f'{context}')

    # Generate response using the LLM
    prompt = f"""You are an AI learning assistant called Axon. who provide accurate answers based on the given context.  
Carefully examine the following text and generate a precise, well-structured response in markdown format.  

### Video Context:  
{context}  

### Question:  
{query}  

#### Instructions:  
- Provide a clear, concise, and informative response based on the given context.  
- If the question is out of scope or the context does not provide sufficient information, respond appropriately by stating that the necessary details are not available in the provided video context.
"""
    response = llm.invoke(prompt)

    return {"response": response}


@router.post("/querybymetadata")
async def query_video(request: QueryVideoRequest):
    video_id = request.video_id
    query = request.query

    # Embed query
    embedded_query = embedding_function.embed_query(query)

    # Retrieve documents from ChromaDB
    results = collection.get(
        where={"video_id": video_id},
    )

    if not results["documents"]:
        return {"response": "No relevant documents found."}

    # Concatenate retrieved documents
    context = " ".join(results["documents"][0])

    logger.info(f' No of documents:{len(results)}')


    # Generate response using the LLM
    prompt = f"""take all this data that you are given and i want you to prepare flash cards so you can quiz me on them, so generate questions based on the text, and also have options with it 1 of the options is the correct awnser and the others are fake, try to confuse the user by tricking them into thinking the other options could be right, but in reality they are not, get as technical as possible while coming up with the quiestions also try to cover every fact and details of the data provided. 

### Data:  
{context}  

#### Instructions:  
always try to return the response in nothing but JSON, so i can correctly parse the data.
also always try and generate atleast a min of 10 questions.
dont refer to the text given as data in the quiz.
"correct" key should return type number
"""
    response = llm.invoke(prompt)
    response.json()
    extractedJson = extract_json(response.content)


    return {"response": extractedJson, "no_of_questions": len(extractedJson)}