import os
from typing import Optional, List, Dict
from dotenv import load_dotenv
from services import llm_service

load_dotenv()

async def call_model(
    model_name: str,
    messages: List[Dict[str, str]],
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None,
    temperature: float = 0.7
) -> str:
    """
    Centralized function to call any AI model.
    Routes to the appropriate service based on configuration.
    
    Two-tier access:
    1. If user provides api_key → Use their key (no restrictions)
    2. If no api_key → Use admin key (requires permission check in chat_service)
    
    Args:
        model_name: Name of the model to use
        messages: List of message dicts with 'role' and 'content'
        api_key: Optional API key from user (if provided, bypasses admin key)
        api_endpoint: Optional custom endpoint URL
        temperature: Temperature for generation (default 0.7)
    
    Returns:
        AI response text
    
    Raises:
        ValueError: If required API key is missing
        Exception: If API call fails
    """
    try:
        from settings_client import get_admin_openrouter_key
    except ImportError:
        async def get_admin_openrouter_key(): return None
    
    
    # 1. Custom Endpoint
    if api_endpoint:
        return await llm_service.call_custom_endpoint(
            api_endpoint, model_name, messages, api_key
        )
    
    # 2. Free Models (OpenRouter) - use admin key if user didn't provide one
    if llm_service.is_free_model(model_name):
        # User provided their own key - use it directly
        if api_key:
            return await llm_service.call_openrouter(model_name, messages, api_key)
        
        # No user key - try to fetch admin key
        admin_key = await get_admin_openrouter_key()
        if admin_key:
            return await llm_service.call_openrouter(model_name, messages, admin_key)
        
        # Fallback to env var (backward compatibility)
        env_key = os.getenv("OPENROUTER_API_KEY")
        if env_key:
            return await llm_service.call_openrouter(model_name, messages, env_key)
        
        raise ValueError("OpenRouter API key not configured by admin. Please contact administrator.")
    
    # 3. GPT Models (OpenAI) - user key or env var
    if model_name.startswith("gpt"):
        final_api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not final_api_key:
            raise ValueError("OpenAI API key required for GPT models. Add it in Settings.")
        return await llm_service.call_openai(model_name, messages, final_api_key)
    
    # 4. Gemini Models (Google) - user key or env var
    if model_name.startswith("gemini"):
        final_api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not final_api_key:
            raise ValueError("Google API key required for Gemini models. Add it in Settings.")
        return await llm_service.call_google_gemini(model_name, messages, final_api_key)
    
    # 5. Fallback -> OpenRouter with admin key
    if api_key:
        return await llm_service.call_openrouter(model_name, messages, api_key)
    
    admin_key = await get_admin_openrouter_key()
    if admin_key:
        return await llm_service.call_openrouter(model_name, messages, admin_key)
    
    env_key = os.getenv("OPENROUTER_API_KEY")
    if env_key:
        return await llm_service.call_openrouter(model_name, messages, env_key)
    
    raise ValueError("OpenRouter API key not configured. Please contact administrator.")


def is_free_model(model_name: str) -> bool:
    """Check if a model is free (via OpenRouter)."""
    return llm_service.is_free_model(model_name)

async def get_completion(
    prompt: str,
    model_name: str = "gemini-2.5-flash-lite",
    system_message: Optional[str] = None,
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None
) -> str:
    """
    Get a simple completion for a prompt.
    
    Args:
        prompt: User prompt
        model_name: Model to use
        system_message: Optional system message
        api_key: Optional API key
        api_endpoint: Optional custom endpoint
    
    Returns:
        AI response text
    """
    messages = []
    if system_message:
        messages.append({"role": "system", "content": system_message})
    messages.append({"role": "user", "content": prompt})
    
    return await call_model(model_name, messages, api_key, api_endpoint)
