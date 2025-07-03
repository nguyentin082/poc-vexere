from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional
from src.services.ticket_service import (
    read_all_tickets,
    create_ticket,
    get_ticket_by_id,
    update_ticket,
    delete_ticket,
)

router = APIRouter()


@router.get("/")
async def get_all_tickets():
    """Get all tickets"""
    try:
        tickets = await read_all_tickets()
        return {"success": True, "data": tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticket_id}")
async def get_ticket_by_id_endpoint(ticket_id: str):
    """Get a specific ticket by ID"""
    try:
        ticket = await get_ticket_by_id(ticket_id)
        return {"success": True, "data": ticket}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_new_ticket(request: Request):
    """Create a new ticket"""
    try:
        ticket_data = await request.json()
        created_ticket = await create_ticket(ticket_data)
        return {
            "success": True,
            "data": created_ticket,
            "message": "Ticket created successfully",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{ticket_id}")
async def update_ticket_endpoint(ticket_id: str, request: Request):
    """Update an existing ticket"""
    try:
        update_data = await request.json()
        updated_ticket = await update_ticket(ticket_id, update_data)
        return {
            "success": True,
            "data": updated_ticket,
            "message": "Ticket updated successfully",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{ticket_id}")
async def delete_ticket_endpoint(ticket_id: str):
    """Delete a ticket"""
    try:
        await delete_ticket(ticket_id)
        return {"success": True, "message": "Ticket deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
