import os
import sys
import json
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId
from src.integrates.mongo import get_client
from src.schema.chat_history_schema import (
    validate_chat_history_data,
    serialize_chat_history,
)

COLLECTION_NAME = "chat_histories"


async def read_all_chat_histories():
    """Get all chat histories"""
    try:
        client = get_client()
        chat_histories = list(client.find_all(COLLECTION_NAME))
        return [serialize_chat_history(chat) for chat in chat_histories]
    except Exception as e:
        raise Exception(f"Error fetching chat histories: {str(e)}")


async def get_chat_history_by_id(chat_id: str):
    """Get a specific chat history by ID with validation"""
    try:
        # Validate ObjectId format
        try:
            ObjectId(chat_id)
        except:
            raise ValueError("Invalid chat history ID format")

        client = get_client()
        query = {"_id": ObjectId(chat_id)}
        chat_history = client.find_one(COLLECTION_NAME, query)

        if not chat_history:
            raise ValueError("Chat history not found")

        return serialize_chat_history(chat_history)
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error fetching chat history: {str(e)}")


async def create_chat_history(chat_data: Dict):
    """Create a new chat history with validation"""
    try:
        # Validate chat history data
        validated_data = validate_chat_history_data(chat_data, is_update=False)

        # Ensure default status if not provided
        if "status" not in validated_data:
            validated_data["status"] = "active"

        # Ensure messages array exists
        if "messages" not in validated_data:
            validated_data["messages"] = []

        # Add timestamps
        current_time = datetime.utcnow()
        validated_data["createdAt"] = current_time
        validated_data["updatedAt"] = current_time

        client = get_client()
        result = client.insert_one(COLLECTION_NAME, validated_data)

        # Return the created chat history
        created_chat = client.find_one(COLLECTION_NAME, {"_id": result.inserted_id})
        return serialize_chat_history(created_chat)
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error creating chat history: {str(e)}")


async def update_chat_history(chat_id: str, chat_data: Dict):
    """Update an existing chat history with validation"""
    try:
        # Validate ObjectId format
        try:
            ObjectId(chat_id)
        except:
            raise ValueError("Invalid chat history ID format")

        # Validate update data
        validated_data = validate_chat_history_data(chat_data, is_update=True)

        # Remove None values from update_data
        filtered_update_data = {
            k: v for k, v in validated_data.items() if v is not None
        }

        if not filtered_update_data:
            raise ValueError("No valid fields to update")

        # Add updated timestamp
        filtered_update_data["updatedAt"] = datetime.utcnow()

        client = get_client()
        query = {"_id": ObjectId(chat_id)}
        update_data = {"$set": filtered_update_data}

        result = client.update_one(COLLECTION_NAME, query, update_data)

        if result.modified_count > 0:
            # Return the updated chat history
            updated_chat = client.find_one(COLLECTION_NAME, {"_id": ObjectId(chat_id)})
            return serialize_chat_history(updated_chat)
        elif result.matched_count == 0:
            raise ValueError("Chat history not found")
        else:
            raise ValueError("No changes made to chat history")
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error updating chat history: {str(e)}")


async def delete_chat_history(chat_id: str):
    """Delete a chat history with validation"""
    try:
        # Validate ObjectId format
        try:
            ObjectId(chat_id)
        except:
            raise ValueError("Invalid chat history ID format")

        client = get_client()

        # Check if chat history exists first
        existing_chat = client.find_one(COLLECTION_NAME, {"_id": ObjectId(chat_id)})
        if not existing_chat:
            raise ValueError("Chat history not found")

        query = {"_id": ObjectId(chat_id)}
        result = client.delete_one(COLLECTION_NAME, query)
        return result.deleted_count > 0
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error deleting chat history: {str(e)}")


async def add_message_to_chat(chat_id: str, message_data: Dict):
    """Add a new message to an existing chat history"""
    try:
        # Validate ObjectId format
        try:
            ObjectId(chat_id)
        except:
            raise ValueError("Invalid chat history ID format")

        # Validate message data
        if "role" not in message_data or message_data["role"] not in [
            "user",
            "assistant",
        ]:
            raise ValueError("Message must have valid role: 'user' or 'assistant'")

        if "content" not in message_data or not message_data["content"]:
            raise ValueError("Message content is required")

        # Generate message ID and timestamp
        import uuid

        new_message = {
            "id": f"msg_{str(uuid.uuid4())[:8]}",
            "role": message_data["role"],
            "content": message_data["content"],
            "timestamp": datetime.utcnow(),
        }

        client = get_client()

        # Check if chat history exists
        existing_chat = client.find_one(COLLECTION_NAME, {"_id": ObjectId(chat_id)})
        if not existing_chat:
            raise ValueError("Chat history not found")

        # Add message to the messages array
        query = {"_id": ObjectId(chat_id)}
        update_data = {
            "$push": {"messages": new_message},
            "$set": {"updatedAt": datetime.utcnow()},
        }

        result = client.update_one(COLLECTION_NAME, query, update_data)

        if result.modified_count > 0:
            # Return the updated chat history
            updated_chat = client.find_one(COLLECTION_NAME, {"_id": ObjectId(chat_id)})
            return serialize_chat_history(updated_chat)
        else:
            raise ValueError("Failed to add message to chat history")

    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error adding message to chat history: {str(e)}")
