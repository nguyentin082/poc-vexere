import os
import sys
import json
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId
from src.integrates.mongo import get_client

COLLECTION_NAME = "tickets"


def serialize_ticket(ticket):
    """Convert MongoDB document to JSON serializable format"""
    if ticket:
        ticket["id"] = str(ticket["_id"])
        del ticket["_id"]

        # Convert datetime objects to ISO string format
        if "createdAt" in ticket and isinstance(ticket["createdAt"], datetime):
            ticket["createdAt"] = ticket["createdAt"].isoformat()
        if "updatedAt" in ticket and isinstance(ticket["updatedAt"], datetime):
            ticket["updatedAt"] = ticket["updatedAt"].isoformat()
    return ticket


def validate_ticket_data(data: dict, is_update: bool = False):
    """Validate ticket data with comprehensive business rules"""
    errors = []

    if not is_update:
        # Required fields for creation
        required_fields = ["userName", "type", "date", "time", "from", "to"]
        for field in required_fields:
            if field not in data or not data[field]:
                errors.append(f"Missing required field: {field}")

    # Validate type if provided
    if "type" in data and data["type"]:
        valid_types = ["bus", "train", "plane", "boat"]
        if data["type"] not in valid_types:
            errors.append(f"Invalid type. Must be one of: {valid_types}")

    # Validate payment if provided
    if "payment" in data and data["payment"]:
        payment = data["payment"]
        if not isinstance(payment, dict):
            errors.append("Payment must be a dictionary")
        else:
            if "done" in payment and not isinstance(payment["done"], bool):
                errors.append("Payment 'done' field must be a boolean")

            if "gate" in payment and not isinstance(payment["gate"], str):
                errors.append("Payment 'gate' field must be a string")

    if errors:
        raise ValueError("; ".join(errors))

    return data


async def read_all_tickets():
    """Get all tickets"""
    try:
        client = get_client()
        tickets = list(client.find_all(COLLECTION_NAME))
        return [serialize_ticket(ticket) for ticket in tickets]
    except Exception as e:
        raise Exception(f"Error fetching tickets: {str(e)}")


async def get_ticket_by_id(ticket_id: str):
    """Get a specific ticket by ID with validation"""
    try:
        # Validate ObjectId format
        try:
            ObjectId(ticket_id)
        except:
            raise ValueError("Invalid ticket ID format")

        client = get_client()
        query = {"_id": ObjectId(ticket_id)}
        ticket = client.find_one(COLLECTION_NAME, query)

        if not ticket:
            raise ValueError("Ticket not found")

        return serialize_ticket(ticket)
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error fetching ticket: {str(e)}")


async def create_ticket(ticket_data: Dict):
    """Create a new ticket with validation"""
    try:
        # Validate ticket data
        validated_data = validate_ticket_data(ticket_data, is_update=False)

        # Ensure payment object exists
        if "payment" not in validated_data:
            validated_data["payment"] = {"done": False, "gate": ""}

        # Add timestamps
        current_time = datetime.utcnow()
        validated_data["createdAt"] = current_time
        validated_data["updatedAt"] = current_time

        client = get_client()
        result = client.insert_one(COLLECTION_NAME, validated_data)

        # Return the created ticket
        created_ticket = client.find_one(COLLECTION_NAME, {"_id": result.inserted_id})
        return serialize_ticket(created_ticket)
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error creating ticket: {str(e)}")


async def update_ticket(ticket_id: str, ticket_data: Dict):
    """Update an existing ticket with validation"""
    try:
        # Validate ObjectId format
        try:
            ObjectId(ticket_id)
        except:
            raise ValueError("Invalid ticket ID format")

        # Validate update data
        validated_data = validate_ticket_data(ticket_data, is_update=True)

        # Remove None values from update_data
        filtered_update_data = {
            k: v for k, v in validated_data.items() if v is not None
        }

        if not filtered_update_data:
            raise ValueError("No valid fields to update")

        # Add updated timestamp
        filtered_update_data["updatedAt"] = datetime.utcnow()

        client = get_client()
        query = {"_id": ObjectId(ticket_id)}
        update_data = {"$set": filtered_update_data}

        result = client.update_one(COLLECTION_NAME, query, update_data)

        if result.modified_count > 0:
            # Return the updated ticket
            updated_ticket = client.find_one(
                COLLECTION_NAME, {"_id": ObjectId(ticket_id)}
            )
            return serialize_ticket(updated_ticket)
        elif result.matched_count == 0:
            raise ValueError("Ticket not found")
        else:
            raise ValueError("No changes made to ticket")
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error updating ticket: {str(e)}")


async def delete_ticket(ticket_id: str):
    """Delete a ticket with validation"""
    try:
        # Validate ObjectId format
        try:
            ObjectId(ticket_id)
        except:
            raise ValueError("Invalid ticket ID format")

        client = get_client()

        # Check if ticket exists first
        existing_ticket = client.find_one(COLLECTION_NAME, {"_id": ObjectId(ticket_id)})
        if not existing_ticket:
            raise ValueError("Ticket not found")

        query = {"_id": ObjectId(ticket_id)}
        result = client.delete_one(COLLECTION_NAME, query)
        return result.deleted_count > 0
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Error deleting ticket: {str(e)}")
