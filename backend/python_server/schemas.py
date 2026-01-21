from pydantic import BaseModel
from typing import List, Dict, Any

# Moved constant here as it's used in default value
DEFAULT_FREE_MODEL = "openrouter/auto"

class ChatRequest(BaseModel):
    session_id: str
    message: str
    model: str = DEFAULT_FREE_MODEL
    api_key: str | None = None
    api_endpoint: str | None = None 

class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]] = []
    is_error: bool = False
    attachments: List[Dict[str, Any]] = []
