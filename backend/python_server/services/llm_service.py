import os
import httpx
from schemas import DEFAULT_FREE_MODEL
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

FREE_MODELS = [
    "openrouter/auto",
]

def is_free_model(model_name: str) -> bool:
    return model_name in FREE_MODELS or model_name.endswith(":free")

async def call_openrouter(model: str, messages: list, api_key: str = OPENROUTER_API_KEY) -> str:
    if not api_key:
        api_key = OPENROUTER_API_KEY
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
    async with httpx.AsyncClient(timeout=120.0) as client:
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

async def call_custom_endpoint(endpoint: str, model: str, messages: list, api_key: str = None) -> str:
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    if not endpoint.endswith('/chat/completions'):
        endpoint = endpoint.rstrip('/') + '/chat/completions'
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                endpoint,
                headers=headers,
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                }
            )
            
            if response.status_code != 200:
                error_text = response.text
                raise Exception(f"Custom endpoint error: {response.status_code} - {error_text}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except httpx.ConnectError:
            raise Exception(f"Could not connect to {endpoint}. Make sure the local server is running.")
        except Exception as e:
            raise Exception(f"Custom endpoint error: {str(e)}")
