from langchain_community.vectorstores import Chroma  # type: ignore
from langchain_community.embeddings import FastEmbedEmbeddings  # type: ignore
from langchain.chains import RetrievalQA  # type: ignore
from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore
from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore
import os
from fastapi import APIRouter, File, HTTPException, Depends, Request, UploadFile
from io import BytesIO
import fitz  # PyMuPDF for PDFs # type: ignore
from docx import Document  # type: ignore
from dotenv import load_dotenv
from pydantic import BaseModel
import re
import time
import asyncio
import json
from langchain_groq import ChatGroq # type: ignore

# Load environment variables from .env file
load_dotenv()

router = APIRouter()

# Initialize embeddings and vector store
embeddings = FastEmbedEmbeddings()

# Initialize ChromaDB with local persistence
persistence_directory = "./chroma_db"
vector_store = Chroma(embedding_function=embeddings, persist_directory=persistence_directory)

# Initialize text splitter and retriever
text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=50)
retriever = vector_store.as_retriever()

# Initialize the QA chain with Gemini model
# llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=os.getenv('GEMINI_API_KEY'))
llm = ChatGroq(model="llama-3.1-8b-instant",temperature=0.0, max_retries=2,)
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
async def ingest_file(request: IngestVideoRequest):
    user_id = request.user_id
    video_id = request.video_id
    transcript = request.transcript

    # Clean the text
    text = clean_text(transcript)

    # Split text into chunks
    chunks = text_splitter.split_text(text)

    # Embed and store chunks in the vector store
    for chunk in chunks:
        vector_store.add_texts([chunk], metadatas=[{"user_id": user_id, "video_id": video_id}])

    # Persist the vector store to the directory
    vector_store.persist()





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
async def query_file(request: QueryVideoRequest):
    video_id = request.video_id
    query = request.query

    corrected_query = "always answer in first person, you are a teaching assistant named Axon, you don't need to mention it, also only awnser if the data is provided to you.:" + query

    # Retrieve relevant documents for the user
    docs = vector_store.similarity_search(query, k=10, filter={"video_id": video_id})

    if docs is None:
        return {'response':"i dont know."}
    else:
        # Generate response using the QA chain
        response = qa_chain.run({"input_documents": docs, "query": corrected_query})
        if response:
            return {"response": response}

        # Handle cases where the QA chain returns an empty response
        if not response or response.strip() == "":
            return {"response": "No data available."}
    



class QuizRequest(BaseModel):
    user_id: str
    subject: str

@router.post("/generateQuiz")
async def generateQuiz(request: QuizRequest):
    user_id = request.user_id
    subject = request.subject

    # Retrieve relevant documents based on the subject and user_id
    relevant_docs = qa_chain.run({"input_documents": vector_store.similarity_search("", k=1000, filter={"user_id": user_id}), "query": subject})

    # Check if any documents were found
    if not relevant_docs:
        return {"response": "No data available for the specified user_id and subject."}

    # Generate multiple-choice questions
    questions = []
    batch_size = 5  # Number of chunks to process in each batch
    for i in range(0, len(relevant_docs), batch_size):
        batch = relevant_docs[i:i + batch_size]
        tasks = [generate_question(doc[i]['page_content']) for doc in batch]
        batch_questions = await asyncio.gather(*tasks)
        questions.extend(batch_questions)

        # Introduce a delay to avoid hitting rate limits
        await asyncio.sleep(5)

        # Stop if we have at least 10 questions
        if len(questions) >= 10:
            break

    # Return the generated questions
    only_quest = []
    for quest1 in questions:
        if isinstance(quest1, dict) and 'content' in quest1:
            only_quest.append(quest1['content'])
        elif isinstance(quest1, str):
            only_quest.append(quest1)

    return {"questions": only_quest}

async def generate_question(text):
    prompt = f"Generate a multiple-choice question based on the following text:\n{text}\n\nOptions:"
    response = llm.invoke(prompt)
    if isinstance(response, dict) and 'content' in response:
        return response['content']
    elif isinstance(response, str):
        return response
    return ""
