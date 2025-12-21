import os
import shutil
import httpx
from typing import List
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.orm import sessionmaker, Session, declarative_base

# LangChain Imports - minimal set
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load Env Vars
from dotenv import load_dotenv
load_dotenv()

# --- CONFIGURATION ---
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") 
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
CHROMA_PATH = "./chroma_db"
UPLOAD_FOLDER = "./uploaded_docs"

# Free models that use server's OpenRouter API key
# openrouter/auto automatically picks the best available free model
FREE_MODELS = [
    "openrouter/auto",
]
DEFAULT_FREE_MODEL = "openrouter/auto"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- DATABASE SETUP (SQLAlchemy) ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ApplicationLog(Base):
    __tablename__ = "application_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_query = Column(Text)
    ai_response = Column(Text)
    model = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- RAG INITIALIZATION ---

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=GOOGLE_API_KEY
)

vectorstore = Chroma(
    persist_directory=CHROMA_PATH,
    embedding_function=embeddings,
    collection_name="rag_collection"
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# --- API MODELS ---

class ChatRequest(BaseModel):
    session_id: str
    message: str
    model: str = DEFAULT_FREE_MODEL
    api_key: str | None = None

class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []

# --- FASTAPI APP ---

app = FastAPI(title="RAG Chat API")

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = None,
    session_id: str = None
):
    """Uploads a PDF/DOCX, chunks it, and adds it to the Vector DB."""
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    documents = []
    if file.filename.endswith('.pdf'):
        loader = PyPDFLoader(file_path)
        documents.extend(loader.load())
    elif file.filename.endswith('.docx'):
        loader = Docx2txtLoader(file_path)
        documents.extend(loader.load())
    else:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    
    for split in splits:
        split.metadata.update({
            "user_id": user_id or "unknown",
            "session_id": session_id or "unknown",
            "file_name": file.filename
        })

    vectorstore.add_documents(documents=splits)
    
    return {"message": f"Processed {len(splits)} chunks from {file.filename}"}

def is_free_model(model_name: str) -> bool:
    """Check if model is a free OpenRouter model"""
    return model_name in FREE_MODELS or model_name.endswith(":free")

def get_retrieved_context(query: str) -> str:
    """Get relevant context from vector store"""
    try:
        docs = retriever.invoke(query)
        if docs:
            return "\n\n---\n\n".join([doc.page_content for doc in docs])
        return ""
    except Exception as e:
        print(f"Retrieval error: {e}")
        return ""

async def call_openrouter(model: str, messages: list, api_key: str) -> str:
    """Call OpenRouter API directly with httpx"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://rag-chat.app",
                "X-Title": "RAG Chat"
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.7,
            }
        )
        
        if response.status_code != 200:
            error_text = response.text
            raise Exception(f"OpenRouter API error: {response.status_code} - {error_text}")
        
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def call_google_gemini(model: str, messages: list, api_key: str) -> str:
    """Call Google Gemini API directly"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        # Convert messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
        
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            json={
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7
                }
            }
        )
        
        if response.status_code != 200:
            error_text = response.text
            raise Exception(f"Gemini API error: {response.status_code} - {error_text}")
        
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

async def call_openai(model: str, messages: list, api_key: str) -> str:
    """Call OpenAI API directly"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.7,
            }
        )
        
        if response.status_code != 200:
            error_text = response.text
            raise Exception(f"OpenAI API error: {response.status_code} - {error_text}")
        
        data = response.json()
        return data["choices"][0]["message"]["content"]

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    """Handles chat interaction with history from Postgres."""
    
    # Fetch History from Postgres
    history_records = db.query(ApplicationLog)\
        .filter(ApplicationLog.session_id == request.session_id)\
        .order_by(ApplicationLog.created_at)\
        .all()
    
    # Build message history for API
    messages = []
    for record in history_records:
        messages.append({"role": "user", "content": record.user_query})
        messages.append({"role": "assistant", "content": record.ai_response})
    
    model_name = request.model or DEFAULT_FREE_MODEL
    
    try:
        # Get context from vector store
        context = get_retrieved_context(request.message)
        
        # Build system message with context
        system_message = """You are a helpful AI assistant. Use the following context to answer the user's question.
If the answer is not in the context, use your general knowledge but mention that.

Context:
""" + (context if context else "No specific context available.")
        
        # Prepare messages with system prompt
        api_messages = [{"role": "system", "content": system_message}]
        api_messages.extend(messages)
        api_messages.append({"role": "user", "content": request.message})
        
        # Call appropriate API
        if is_free_model(model_name):
            ai_response_text = await call_openrouter(model_name, api_messages, OPENROUTER_API_KEY)
        elif model_name.startswith("gpt"):
            if not request.api_key:
                raise ValueError("OpenAI API key required. Add it in Settings.")
            ai_response_text = await call_openai(model_name, api_messages, request.api_key)
        elif model_name.startswith("gemini"):
            if not request.api_key:
                raise ValueError("Google API key required. Add it in Settings.")
            ai_response_text = await call_google_gemini(model_name, api_messages, request.api_key)
        else:
            # Default to OpenRouter for unknown models
            ai_response_text = await call_openrouter(model_name, api_messages, OPENROUTER_API_KEY)
            
    except ValueError as e:
        ai_response_text = f"Configuration error: {str(e)}"
    except Exception as e:
        ai_response_text = f"Error with model {model_name}: {str(e)}"
    
    # Save to database
    new_log = ApplicationLog(
        session_id=request.session_id,
        user_query=request.message,
        ai_response=ai_response_text,
        model=model_name
    )
    db.add(new_log)
    db.commit()
    
    return ChatResponse(response=ai_response_text, sources=[])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
