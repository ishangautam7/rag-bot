from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from database import Base, engine

class ApplicationLog(Base):
    __tablename__ = "application_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_query = Column(Text)
    ai_response = Column(Text)
    model = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    filename = Column(String)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# Ensure tables are created
Base.metadata.create_all(bind=engine)
