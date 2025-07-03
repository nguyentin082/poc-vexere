from fastapi import APIRouter, Request, HTTPException
import re
import sys
import os
from src.services.faq_service import faq_rag_chat

router = APIRouter()


@router.post("/")
async def faq_route(request: Request):
    try:
        json_body = await request.json()
        message = json_body.get("message")
        return faq_rag_chat(message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
