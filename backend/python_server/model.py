import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from services import llm_service

load_dotenv()

async def get_llm(
    model_name: str,
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None,
    temperature: float = 0.7
):
    """
    Factory to create the appropriate LangChain chat model.
    Handles API key resolution including Admin keys for free models.
    """
    final_api_key = api_key
    
    # 1. Resolve API Key if not provided
    if not final_api_key:
        # Check Custom Endpoint first
        if api_endpoint:
             final_api_key = os.getenv("OPENROUTER_API_KEY") # Default for custom generic
        
        # Check Free Models (OpenRouter)
        elif llm_service.is_free_model(model_name):
            try:
                from settings_client import get_admin_openrouter_key
                final_api_key = await get_admin_openrouter_key()
            except ImportError:
                pass
            
            if not final_api_key:
                final_api_key = os.getenv("OPENROUTER_API_KEY")
                
            if not final_api_key:
                 raise ValueError("OpenRouter API key not configured. Please contact administrator.")
        
        # Check GPT
        elif model_name.startswith("gpt"):
             final_api_key = os.getenv("OPENAI_API_KEY")
             if not final_api_key:
                raise ValueError("OpenAI API key required. Add it in Settings.")

        # Check Gemini
        elif model_name.startswith("gemini"):
             final_api_key = os.getenv("GOOGLE_API_KEY")
             if not final_api_key:
                raise ValueError("Google API key required. Add it in Settings.")
        
        # Fallback (OpenRouter/Custom)
        else:
             try:
                from settings_client import get_admin_openrouter_key
                final_api_key = await get_admin_openrouter_key()
             except:
                 pass
             if not final_api_key:
                final_api_key = os.getenv("OPENROUTER_API_KEY")

    # 2. Return LangChain Object
    
    # Custom Endpoint / OpenRouter
    if api_endpoint or (not model_name.startswith("gpt") and not model_name.startswith("gemini")):
        base_url = api_endpoint if api_endpoint else "https://openrouter.ai/api/v1"
        return ChatOpenAI(
            model=model_name,
            api_key=final_api_key,
            base_url=base_url,
            temperature=temperature,
            default_headers={
                "HTTP-Referer": "https://rag-chat.app",
                "X-Title": "RAG Chat"
            }
        )

    # Google Gemini
    if model_name.startswith("gemini"):
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=final_api_key,
            temperature=temperature,
            convert_system_message_to_human=True,
            transport="rest"
        )
    
    # OpenAI Native
    if model_name.startswith("gpt"):
        return ChatOpenAI(
            model=model_name,
            api_key=final_api_key,
            temperature=temperature
        )
        
    raise ValueError(f"Unsupported model: {model_name}")

async def call_model(
    model_name: str,
    messages: List[Dict[str, str]],
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None,
    temperature: float = 0.7
) -> str:
    """
    Centralized function to call any AI model using LangChain.
    """
    llm = await get_llm(model_name, api_key, api_endpoint, temperature)
    
    # Convert dict messages to LangChain messages
    lc_messages = []
    for msg in messages:
        if msg['role'] == 'system':
            lc_messages.append(SystemMessage(content=msg['content']))
        elif msg['role'] == 'user':
            lc_messages.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'assistant':
            lc_messages.append(AIMessage(content=msg['content']))
            
    response = await llm.ainvoke(lc_messages)
    return response.content

# Keep helpers
def is_free_model(model_name: str) -> bool:
    return llm_service.is_free_model(model_name)

async def get_completion(
    prompt: str,
    model_name: str = "gemini-2.5-flash-lite",
    system_message: Optional[str] = None,
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None
) -> str:
    messages = []
    if system_message:
        messages.append({"role": "system", "content": system_message})
    messages.append({"role": "user", "content": prompt})
    
    return await call_model(model_name, messages, api_key, api_endpoint)
