import os
import shutil
from typing import List
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# LangChain Imports
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains.history_aware_retriever import create_history_aware_retriever
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

# Load Env Vars
from dotenv import load_dotenv
load_dotenv()

# --- CONFIGURATION ---
DATABASE_URL = os.getenv("DATABASE_URL")
# Normalize SQLAlchemy URL scheme for Postgres
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") 
CHROMA_PATH = "./chroma_db"
UPLOAD_FOLDER = "./uploaded_docs"

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

# Create tables if they don't exist (or rely on Prisma)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- RAG INITIALIZATION ---

# 1. Setup LLM and Embeddings
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", # Updated to latest efficient model
    temperature=0.7,
    google_api_key=GOOGLE_API_KEY
)

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=GOOGLE_API_KEY
)

# 2. Setup Vector Store (Persistent)
vectorstore = Chroma(
    persist_directory=CHROMA_PATH,
    embedding_function=embeddings,
    collection_name="rag_collection"
)

# 3. Setup Retriever & Prompts
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

contextualize_q_system_prompt = """
Given a chat history and the latest user question
which might reference context in the chat history,
formulate a standalone question which can be understood
without the chat history. Do NOT answer the question,
just reformulate it if needed and otherwise return it as is.
"""

contextualize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", contextualize_q_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

qa_system_prompt = """
You are a helpful AI assistant. Use the following context to answer the user's question.
If the answer is not in the context, say you don't know.

Context: {context}
"""

qa_prompt = ChatPromptTemplate.from_messages([
    ("system", qa_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

# 4. Create Chains
history_aware_retriever = create_history_aware_retriever(
    llm, retriever, contextualize_q_prompt
)
question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

# --- API MODELS ---

class ChatRequest(BaseModel):
    session_id: str
    message: str
    model: str = "gemini-2.0-flash"
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
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Load Document
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
    
    # Split
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    
    for split in splits:
        split.metadata.update({
            "user_id": user_id or "unknown",
            "session_id": session_id or "unknown",
            "file_name": file.filename
        })

    # Add to Chroma (Persist automatically happens in new versions)
    vectorstore.add_documents(documents=splits)
    
    return {"message": f"Processed {len(splits)} chunks from {file.filename}"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    """Handles chat interaction with history from Postgres."""
    
    # 1. Fetch History from Postgres
    history_records = db.query(ApplicationLog)\
        .filter(ApplicationLog.session_id == request.session_id)\
        .order_by(ApplicationLog.created_at)\
        .all()
    
    chat_history = []
    for record in history_records:
        chat_history.append(HumanMessage(content=record.user_query))
        chat_history.append(AIMessage(content=record.ai_response))
    
    # 2. Create dynamic LLM based on model selection
    model_name = request.model or "gemini-2.0-flash"
    api_key = request.api_key or GOOGLE_API_KEY
    
    try:
        if model_name.startswith("gpt"):
            # OpenAI models
            from langchain_openai import ChatOpenAI
            dynamic_llm = ChatOpenAI(
                model=model_name,
                temperature=0.7,
                api_key=api_key
            )
        else:
            # Gemini models (default)
            dynamic_llm = ChatGoogleGenerativeAI(
                model=model_name,
                temperature=0.7,
                google_api_key=api_key
            )
        
        # Create dynamic chains
        dynamic_history_retriever = create_history_aware_retriever(
            dynamic_llm, retriever, contextualize_q_prompt
        )
        dynamic_qa_chain = create_stuff_documents_chain(dynamic_llm, qa_prompt)
        dynamic_rag_chain = create_retrieval_chain(dynamic_history_retriever, dynamic_qa_chain)
        
        # Invoke RAG Chain
        result = dynamic_rag_chain.invoke({
            "input": request.message,
            "chat_history": chat_history
        })
        
        ai_response_text = result["answer"]
    except Exception as e:
        ai_response_text = f"Error with model {model_name}: {str(e)}"
        result = None
    
    # 3. Extract Sources (optional)
    sources = []
    if result:
        sources = list(set([doc.metadata.get("source", "unknown") for doc in result.get("context", [])]))
    
    # 4. Save Interaction to DB
    new_log = ApplicationLog(
        session_id=request.session_id,
        user_query=request.message,
        ai_response=ai_response_text,
        model=model_name
    )
    db.add(new_log)
    db.commit()
    
    return ChatResponse(response=ai_response_text, sources=sources)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
