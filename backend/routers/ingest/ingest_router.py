from fastapi import APIRouter, File, HTTPException, Depends, Response, Request, UploadFile
from io import BytesIO
import fitz  # PyMuPDF for PDFs # type: ignore
from docx import Document # type: ignore

router = APIRouter()

@router.post("/ingest")
async def ingest_file(file: UploadFile = File(...)):
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
        elif content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            text = extract_docx(file)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    return ({"file_name": file.filename, "content": text})

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
