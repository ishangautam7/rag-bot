import os
from fastapi import FastAPI, UploadFile, File, Depends, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Document
from schemas import ChatRequest, ChatResponse
from services import rag_service, chat_service

app = FastAPI(title="RAG Chat API")

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(None),
    session_id: str = Form(None),
    db: Session = Depends(get_db)
):
    """Uploads a PDF/DOCX, chunks it, and adds it to the Vector DB."""
    try:
        num_chunks = await rag_service.process_document(file, user_id, session_id, db)
        return {"message": f"Processed {num_chunks} chunks from {file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{session_id}")
def get_documents(session_id: str, db: Session = Depends(get_db)):
    """Get list of uploaded documents for a session"""
    docs = db.query(Document).filter(Document.session_id == session_id).all()
    return [{"id": d.id, "filename": d.filename, "created_at": d.created_at} for d in docs]

@app.get("/documents/file/{filename}")
def get_document_file(filename: str):
    """Download/View a specific document"""
    file_path = os.path.join(rag_service.UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    """Handles chat interaction with history from Postgres."""
    print(request)
    return await chat_service.process_chat(request, db)

@app.post("/process-pdf")
async def process_pdf_endpoint(
    file: UploadFile = File(...),
    instruction: str = Form(""),
    model_name: str = Form("gemini-2.5-flash-lite"),
    api_key: str = Form(None)
):
    """
    Process a PDF file with AI assistance.
    - If instruction is provided: Modify PDF according to instruction
    - If instruction is empty: Auto-improve the PDF (fix grammar, clarity, etc.)
    
    Returns the modified PDF file.
    """
    from agent import process_pdf
    import tempfile
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Process the PDF
        result = await process_pdf(
            file_path=tmp_file_path,
            instruction=instruction,
            model_name=model_name,
            api_key=api_key
        )
        
        # Clean up input file
        os.unlink(tmp_file_path)
        
        if result["success"]:
            # Return the modified PDF
            return FileResponse(
                result["output_file"],
                media_type="application/pdf",
                filename=f"modified_{file.filename}",
                background=lambda: os.unlink(result["output_file"]) if os.path.exists(result["output_file"]) else None
            )
        else:
            raise HTTPException(status_code=500, detail=result["summary"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)