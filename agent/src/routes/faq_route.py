from fastapi import APIRouter, Request, HTTPException
import re

router = APIRouter()

@router.post("/")
async def process_data(request: Request):
    try:
        json_body = await request.json()
        id = json_body.get("id")
        input = json_body.get("input")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



    