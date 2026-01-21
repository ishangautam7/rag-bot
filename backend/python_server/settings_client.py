"""
Settings client for Python server to fetch system settings from Node.js backend.
This allows the Python server to use admin-controlled API keys.
"""
import os
import httpx
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3000")

# Cache for settings to avoid repeated HTTP calls
_settings_cache: Optional[Dict] = None

async def fetch_system_settings() -> Dict:
    """
    Fetch system settings from the Node.js backend.
    Returns admin-controlled configuration including OpenRouter API key.
    """
    global _settings_cache
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # This is a public endpoint that python server can call
            # No auth needed as it's internal communication
            response = await client.get(f"{NODE_BACKEND_URL}/api/admin/settings/public")
            
            if response.status_code == 200:
                _settings_cache = response.json()
                return _settings_cache
            else:
                print(f"Warning: Could not fetch settings from backend: {response.status_code}")
                return _settings_cache or {}
    except Exception as e:
        print(f"Error fetching system settings: {e}")
        return _settings_cache or {}

async def get_admin_openrouter_key() -> Optional[str]:
    """Get the admin's OpenRouter API key from backend."""
    settings = await fetch_system_settings()
    return settings.get("openrouterApiKey")

async def get_system_settings() -> Dict:
    """Get all system settings."""
    return await fetch_system_settings()

def get_cached_settings() -> Dict:
    """Get cached settings synchronously (may be stale)."""
    return _settings_cache or {}
