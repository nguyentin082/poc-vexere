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

        # Chat API processing - this handles creating new chat if needed and saves user message
        # Returns tuple of (actual_chat_id, chat_messages)
        actual_chat_id, chat_messages = await chat_processing(chat_id, message)

        print("=" * 50)
        print(f"Original chat_id: {chat_id}")
        print(f"Actual chat_id: {actual_chat_id}")
        print(f"Chat messages count: {len(chat_messages)}")
        pprint(chat_messages)

        # Call chat service with the actual chat_id (important for saving assistant response)
        response = chat_service(
            message=message,
            chat_history=chat_messages,
            chat_id=actual_chat_id,  # Use actual_chat_id, not original chat_id
        )

        # Ensure the response includes the actual chat_id
        if "chat_id" not in response or not response["chat_id"]:
            response["chat_id"] = actual_chat_id

        print(f"Final response chat_id: {response.get('chat_id')}")
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
