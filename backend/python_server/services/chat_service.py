from sqlalchemy.orm import Session
from schemas import ChatRequest, ChatResponse, DEFAULT_FREE_MODEL
from models import ApplicationLog
from services import rag_service, llm_service
import os
import uuid

async def process_chat(request: ChatRequest, db: Session) -> ChatResponse:
    # Fetch History from Postgres
    history_records = db.query(ApplicationLog)\
        .filter(ApplicationLog.session_id == request.session_id)\
        .order_by(ApplicationLog.created_at)\
        .all()
    
    # Create history list for agent
    chat_history = []
    for record in history_records:
        chat_history.append({"role": "user", "content": record.user_query})
        chat_history.append({"role": "assistant", "content": record.ai_response})

    model_name = request.model
    
    # Get context from RAG if docs exist
    latest_file = rag_service.get_latest_document_path(request.session_id, db)
    has_docs = rag_service.session_has_documents(request.session_id)
    
    context_text = ""
    if has_docs:
        retrieved = rag_service.get_retrieved_context(request.message, request.session_id)
        if retrieved:
            context_text = f"\n\nRELEVANT DOCUMENT CONTEXT:\n{retrieved}\n\n(Use this context to answer questions about the document content)"
    
    # Combine user message with RAG context if applicable
    final_message = request.message
    
    if latest_file:
         final_message += f"\n\n[SYSTEM NOTE: The user has an active file at path: '{latest_file}'. If they ask to edit 'this file', USE THIS PATH with the `read_pdf` tool.]"

    if context_text and "edit" not in request.message.lower():
         final_message += context_text
    
    # Run Agent
    from agent import run_agent
    
    result = await run_agent(
        message=final_message,
        history=chat_history,
        model_name=model_name,
        api_key=request.api_key,
        api_endpoint=request.api_endpoint,
        latest_file=latest_file
    )
    
    # Handle DB Persistence for generated files (Attachments)
    if result.get("attachments"):
        from models import Document
        import datetime
        
        for att in result["attachments"]:
            # Check if this filename is already known to DB to avoid duplicates
            fname = att["name"]
            # We need the local file path to save to DB. 
            # The tool only returned the URL in the final struct, but the name is consistent.
            # We know it is in UPLOAD_FOLDER
            local_path = os.path.join(rag_service.UPLOAD_FOLDER, fname)
            
            if os.path.exists(local_path):
                 existing_doc = db.query(Document).filter(Document.filename == fname).first()
                 if not existing_doc:
                    new_doc = Document(
                        session_id=request.session_id,
                        filename=fname,
                        file_path=local_path,
                        created_at=datetime.datetime.utcnow()
                    )
                    db.add(new_doc)
                    db.commit()
    
    # Log Interaction
    # Check if response indicates a failure even if is_error was technically False (e.g. agent polite refusal)
    response_lower = result["response"].lower()
    if not result.get("is_error", False) and not response_lower.startswith("i encountered an error") and not "processing your request" in response_lower: 
        new_log = ApplicationLog(
            session_id=request.session_id,
            user_query=request.message,
            ai_response=result["response"],
            model=model_name
        )
        db.add(new_log)
        db.commit()

    return ChatResponse(
        response=result["response"],
        sources=[], # RAG sources could be extracted if we returned them from agent
        is_error=result.get("is_error", False),
        attachments=result.get("attachments", [])
    )
