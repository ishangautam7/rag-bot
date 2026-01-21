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
    
    messages = []
    for record in history_records:
        messages.append({"role": "user", "content": record.user_query})
        messages.append({"role": "assistant", "content": record.ai_response})
    
    model_name = request.model or DEFAULT_FREE_MODEL
    is_error = False
    
    # Intent Detection for PDF Editing/Updating
    if "edit pdf" in request.message.lower() or "update pdf" in request.message.lower() or "change" in request.message.lower() and "pdf" in request.message.lower():
        try:
            # Check if there is a file to edit
            latest_file = rag_service.get_latest_document_path(request.session_id, db)
            
            if latest_file:
                from agent import process_pdf
                
                result = await process_pdf(
                    file_path=latest_file,
                    instruction=request.message,
                    model_name=model_name,
                    api_key=request.api_key,
                    api_endpoint=request.api_endpoint
                )
                
                if result['success']:
                    # Save to DB for access control
                    from models import Document
                    import datetime
                    
                    filename = os.path.basename(result['output_file'])
                    existing_doc = db.query(Document).filter(Document.filename == filename).first()
                    
                    if not existing_doc:
                         new_doc = Document(
                            # id is auto-increment
                            session_id=request.session_id,
                            filename=filename,
                            file_path=result['output_file'],
                            created_at=datetime.datetime.utcnow()
                        )
                         db.add(new_doc)
                         db.commit()
                    
                    public_api_url = os.getenv("PUBLIC_API_URL", "http://localhost:4000")
                    download_link = f"{public_api_url}/api/files/{filename}"
                    return ChatResponse(
                        response=result['summary'],
                        sources=[],
                        is_error=False,
                         attachments=[{
                            "name": filename,
                            "type": "application/pdf",
                            "url": download_link.replace("/api/files/", "/api/chat/files/")
                        }]
                    )
                else:
                    print(f"Edit failed: {result['summary']}")
            else:
                # No file found, proceed to generation check or normal chat
                pass
                
        except Exception as e:
            print(f"Edit intent error: {e}")

    # Intent Detection for PDF Generation
    
    # Intent Detection for PDF Generation
    if "create pdf" in request.message.lower() or "draft pdf" in request.message.lower() or ("generate" in request.message.lower() and "pdf" in request.message.lower()):
        try:
            from agent import generate_pdf
            model_name = request.model or DEFAULT_FREE_MODEL
            
            # Use provided API key or fallbacks logic inside generate_pdf/call_model
            result = await generate_pdf(
                instruction=request.message,
                model_name=model_name,
                api_key=request.api_key,
                api_endpoint=request.api_endpoint
            )
            
            if result['success']:
                # Save to DB so Node backend can verify access
                from models import Document
                import datetime
                
                # Check if document already exists (for updates)
                filename = os.path.basename(result['output_file'])
                existing_doc = db.query(Document).filter(Document.filename == filename).first()
                
                if not existing_doc:
                    new_doc = Document(
                        # id is auto-increment
                        session_id=request.session_id,
                        filename=filename,
                        file_path=result['output_file'],
                        created_at=datetime.datetime.utcnow()
                    )
                    db.add(new_doc)
                    db.commit()
                
                # Construct download link pointing to Node Backend (port 4000)
                # Node will verify session access via DB record we just created
                    public_api_url = os.getenv("PUBLIC_API_URL", "http://localhost:4000")
                    return ChatResponse(
                    response=result['summary'],
                    sources=[],
                    is_error=False,
                    attachments=[{
                        "name": filename,
                        "type": "application/pdf",
                        "url": f"{public_api_url}/api/chat/files/{filename}"
                    }]
                )
            else:
                 # Fallback to normal chat if generation fails
                 print(f"Generation failed: {result['summary']}")
        except Exception as e:
            print(f"Intent handling error: {e}")

    try:
        has_docs = rag_service.session_has_documents(request.session_id)
        
        if has_docs:
            context = rag_service.get_retrieved_context(request.message, request.session_id)
            system_message = """You are a helpful AI assistant. Use the following context from uploaded documents to answer the user's question.
If the answer is not in the context, use your general knowledge but mention that.

Context:
""" + (context if context else "No specific context available.")
        else:
            system_message = "You are a helpful AI assistant. Answer the user's questions to the best of your ability."
        
        api_messages = [{"role": "system", "content": system_message}]
        api_messages.extend(messages)
        api_messages.append({"role": "user", "content": request.message})
        
        if request.api_endpoint:
            ai_response_text = await llm_service.call_custom_endpoint(
                request.api_endpoint, model_name, api_messages, request.api_key
            )
        elif llm_service.is_free_model(model_name):
            ai_response_text = await llm_service.call_openrouter(model_name, api_messages, llm_service.OPENROUTER_API_KEY)
        elif model_name.startswith("gpt"):
            api_key = request.api_key or llm_service.OPENAI_API_KEY
            if not api_key:
                raise ValueError("OpenAI API key required. Add it in Settings.")
            ai_response_text = await llm_service.call_openai(model_name, api_messages, api_key)
        elif model_name.startswith("gemini"):
            api_key = request.api_key or llm_service.GOOGLE_API_KEY
            if not api_key:
                raise ValueError("Google API key required. Add it in Settings.")
            ai_response_text = await llm_service.call_google_gemini(model_name, api_messages, api_key)
        else:
            ai_response_text = await llm_service.call_openrouter(model_name, api_messages, llm_service.OPENROUTER_API_KEY)
            
    except ValueError as e:
        ai_response_text = f"Configuration error: {str(e)}"
        is_error = True
    except Exception as e:
        ai_response_text = f"Error with model {model_name}: {str(e)}"
        is_error = True
    
    # Only save to DB if NOT an error
    if not is_error:
        new_log = ApplicationLog(
            session_id=request.session_id,
            user_query=request.message,
            ai_response=ai_response_text,
            model=model_name
        )
        db.add(new_log)
        db.commit()
    
    return ChatResponse(response=ai_response_text, sources=[], is_error=is_error)

