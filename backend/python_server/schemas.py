from pydantic import BaseModel
from typing import List

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
    sources: List[str] = []
