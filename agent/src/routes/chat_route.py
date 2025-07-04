from fastapi import APIRouter, Request, HTTPException
import re
import sys
import os
from pprint import pprint

from src.services.chat_service import chat_service
from src.utils.chat_procesing import chat_processing

router = APIRouter()


@router.post("/")
async def chat(request: Request):
    try:
        json_body = await request.json()
        chat_id = json_body.get("chat_id")
        message = json_body.get("message")
        # Chat API processing
        chat_messages = await chat_processing(chat_id, message)
        print("=" * 50)
        print(f"Chat messages for chat_id {chat_id}:")
        pprint(chat_messages)
        return chat_service(
            message=message, chat_history=chat_messages, chat_id=chat_id
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
