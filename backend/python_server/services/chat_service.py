from sqlalchemy.orm import Session
from schemas import ChatRequest, ChatResponse, DEFAULT_FREE_MODEL
from models import ApplicationLog
from services import rag_service, llm_service

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
            if not request.api_key:
                raise ValueError("OpenAI API key required. Add it in Settings.")
            ai_response_text = await llm_service.call_openai(model_name, api_messages, request.api_key)
        elif model_name.startswith("gemini"):
            if not request.api_key:
                raise ValueError("Google API key required. Add it in Settings.")
            ai_response_text = await llm_service.call_google_gemini(model_name, api_messages, request.api_key)
        else:
            ai_response_text = await llm_service.call_openrouter(model_name, api_messages, llm_service.OPENROUTER_API_KEY)
            
    except ValueError as e:
        ai_response_text = f"Configuration error: {str(e)}"
    except Exception as e:
        ai_response_text = f"Error with model {model_name}: {str(e)}"
    
    new_log = ApplicationLog(
        session_id=request.session_id,
        user_query=request.message,
        ai_response=ai_response_text,
        model=model_name
    )
    db.add(new_log)
    db.commit()
    
    return ChatResponse(response=ai_response_text, sources=[])
