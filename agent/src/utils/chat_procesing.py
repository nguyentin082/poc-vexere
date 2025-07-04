import httpx
from datetime import datetime
from src.core.config import BACKEND_URL

chat_history_url = f"{BACKEND_URL}/api/chat-history/"


async def get_chat_messages_by_id(chat_id: str) -> list[dict]:
    """Get only the messages list from chat history"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{chat_history_url}{chat_id}")
        response.raise_for_status()
        chat_data = response.json()
        return chat_data.get("data", {}).get("messages", [])


async def create_new_chat() -> str:
    """Create a new chat and return its ID"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            chat_history_url,
            json={
                "title": "Chat conversation",
                "status": "active",
                "messages": [],
            },
        )
        response.raise_for_status()
        result = response.json()
        return result["data"]["id"]


async def append_message_to_chat(chat_id: str, message: str, role="user") -> None:
    """Append a message to an existing chat"""
    payload = {
        "role": role,
        "content": message,
        "timestamp": datetime.now().isoformat(),
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{chat_history_url}{chat_id}/messages",
            json=payload,
        )
        response.raise_for_status()


async def chat_exists(chat_id: str) -> bool:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{chat_history_url}{chat_id}")
        if response.status_code == 200:
            return True
        elif response.status_code == 404:
            return False
        else:
            raise Exception(f"Unexpected status code: {response.status_code}")


async def chat_processing(chat_id: str, message: str) -> list[dict]:
    """
    Case 1: If chat_id is empty or none, create a new chat and append the message.
    Case 2: If chat_id exists, append the message to the existing chat.
    Case 3: If chat_id is invalid, raise an error.
    Returns the updated chat messages.
    """
    if not chat_id or str(chat_id).strip().lower() in ["", "null", "undefined"]:
        # Case 1: Create a new chat
        chat_id = await create_new_chat()
        await append_message_to_chat(chat_id, message)
    else:
        # Case 2: Check if chat exists
        if not await chat_exists(chat_id):
            raise ValueError(f"Chat with ID {chat_id} does not exist.")
        # Append the message to the existing chat
        await append_message_to_chat(chat_id, message)

    # Return the updated chat messages
    return await get_chat_messages_by_id(chat_id)
