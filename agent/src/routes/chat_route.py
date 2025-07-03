from fastapi import APIRouter, Request, HTTPException
import re
import sys
import os

from src.services.chat_service import chat_service

router = APIRouter()


@router.post("/")
async def chat(request: Request):
    try:
        json_body = await request.json()
        message = json_body.get("message")
        return chat_service(message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
