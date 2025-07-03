from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional
from src.services.chat_history_service import (
    read_all_chat_histories,
    create_chat_history,
    get_chat_history_by_id,
    update_chat_history,
    delete_chat_history,
    add_message_to_chat,
)
from src.schema.chat_history_schema import (
    ChatHistoryCreateSchema,
    ChatHistoryUpdateSchema,
    AddMessageSchema,
    ChatHistorySearchSchema,
)

router = APIRouter()


@router.get("/")
async def get_all_chat_histories():
    """Get all chat histories"""
    try:
        chat_histories = await read_all_chat_histories()
        return {"success": True, "data": chat_histories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{chat_id}")
async def get_chat_history_by_id_endpoint(chat_id: str):
    """Get a specific chat history by ID"""
    try:
        chat_history = await get_chat_history_by_id(chat_id)
        return {"success": True, "data": chat_history}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_new_chat_history(request: Request):
    """Create a new chat history"""
    try:
        chat_data = await request.json()
        created_chat = await create_chat_history(chat_data)
        return {
            "success": True,
            "data": created_chat,
            "message": "Chat history created successfully",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{chat_id}")
async def update_chat_history_endpoint(chat_id: str, request: Request):
    """Update an existing chat history"""
    try:
        update_data = await request.json()
        updated_chat = await update_chat_history(chat_id, update_data)
        return {
            "success": True,
            "data": updated_chat,
            "message": "Chat history updated successfully",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{chat_id}")
async def delete_chat_history_endpoint(chat_id: str):
    """Delete a chat history"""
    try:
        await delete_chat_history(chat_id)
        return {"success": True, "message": "Chat history deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{chat_id}/messages")
async def add_message_to_chat_endpoint(chat_id: str, request: Request):
    """Add a new message to an existing chat history"""
    try:
        message_data = await request.json()
        updated_chat = await add_message_to_chat(chat_id, message_data)
        return {
            "success": True,
            "data": updated_chat,
            "message": "Message added successfully",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
