import os
import shutil
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from models import Document
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") 
CHROMA_PATH = "./chroma_db"
UPLOAD_FOLDER = "./uploaded_docs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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

def get_retrieved_context(query: str, session_id: str = None) -> str:
    try:
        if session_id:
            docs = vectorstore.similarity_search(
                query,
                k=4,
                filter={"session_id": session_id}
            )
        else:
            docs = retriever.invoke(query)
        
        if docs:
            return "\n\n---\n\n".join([doc.page_content for doc in docs])
        return ""
    except Exception as e:
        print(f"Retrieval error: {e}")
        return ""

def session_has_documents(session_id: str) -> bool:
    try:
        docs = vectorstore.similarity_search(
            "test",
            k=1,
            filter={"session_id": session_id}
        )
        return len(docs) > 0
    except:
        return False

async def process_document(file: UploadFile, user_id: str, session_id: str, db: Session):
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
    
    if session_id:
        doc = Document(session_id=session_id, filename=file.filename, file_path=file_path)
        db.add(doc)
        db.commit()
    
    return len(splits)

def get_latest_document_path(session_id: str, db: Session) -> str:
    """Get the path of the most recent document for a session."""
    try:
        doc = db.query(Document)\
            .filter(Document.session_id == session_id)\
            .order_by(Document.created_at.desc())\
            .first()
        
        if doc and doc.file_path and os.path.exists(doc.file_path):
            return doc.file_path
        
        return None
    except Exception as e:
        print(f"Error getting latest doc: {e}")
        return None
