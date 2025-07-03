from fastapi import APIRouter, Request, HTTPException
import re
import sys
import os

from src.services.after_service_service import after_service_chat

router = APIRouter()


@router.post("/")
async def after_service_route(request: Request):
    try:
        json_body = await request.json()
        message = json_body.get("message")
        return after_service_chat(message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
