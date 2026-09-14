import os
from fastapi import Security, HTTPException
from fastapi.security.api_key import APIKeyHeader
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("INTERNAL_API_SECRET", "default_secret_for_development")
API_KEY_NAME = "Authorization"

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header:
        # Strip 'Bearer ' if present
        token = api_key_header.replace("Bearer ", "")
        if token == API_KEY:
            return token
    raise HTTPException(
        status_code=401, detail="Could not validate credentials"
    )
