from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId


class MessageSchema(BaseModel):
    """Schema cho từng tin nhắn trong cuộc hội thoại"""

    id: str = Field(..., description="ID duy nhất của tin nhắn")
    role: Literal["user", "assistant"] = Field(
        ..., description="Vai trò người gửi: user hoặc assistant"
    )
    content: str = Field(..., description="Nội dung tin nhắn")
    timestamp: datetime = Field(..., description="Thời gian gửi tin nhắn")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class ChatHistoryCreateSchema(BaseModel):
    """Schema để tạo lịch sử chat mới"""

    title: str = Field(
        ..., min_length=1, max_length=200, description="Tiêu đề cuộc hội thoại"
    )
    status: Literal["active", "resolved", "pending"] = Field(
        default="active", description="Trạng thái cuộc hội thoại"
    )
    messages: List[MessageSchema] = Field(default=[], description="Danh sách tin nhắn")

    class Config:
        schema_extra = {
            "example": {
                "title": "Tìm vé Hà Nội - TP.HCM",
                "status": "active",
                "messages": [
                    {
                        "id": "msg_001",
                        "role": "user",
                        "content": "Chào bạn, tôi muốn tìm vé xe từ Hà Nội đi TP.HCM",
                        "timestamp": "2025-01-03T09:00:00.000Z",
                    }
                ],
            }
        }


class ChatHistoryUpdateSchema(BaseModel):
    """Schema để cập nhật lịch sử chat"""

    title: Optional[str] = Field(
        None, min_length=1, max_length=200, description="Tiêu đề cuộc hội thoại"
    )
    status: Optional[Literal["active", "resolved", "pending"]] = Field(
        None, description="Trạng thái cuộc hội thoại"
    )
    messages: Optional[List[MessageSchema]] = Field(
        None, description="Danh sách tin nhắn"
    )

    class Config:
        schema_extra = {
            "example": {
                "title": "Tìm vé Hà Nội - TP.HCM (Đã giải quyết)",
                "status": "resolved",
            }
        }


class AddMessageSchema(BaseModel):
    """Schema để thêm tin nhắn vào cuộc hội thoại"""

    role: Literal["user", "assistant"] = Field(..., description="Vai trò người gửi")
    content: str = Field(..., min_length=1, description="Nội dung tin nhắn")

    class Config:
        schema_extra = {
            "example": {
                "role": "user",
                "content": "Tôi muốn đặt chuyến Phương Trang 6h sáng",
            }
        }


class ChatHistoryResponseSchema(BaseModel):
    """Schema cho response của chat history"""

    id: str = Field(..., description="ID của cuộc hội thoại")
    title: str = Field(..., description="Tiêu đề cuộc hội thoại")
    createdAt: datetime = Field(..., description="Thời gian tạo")
    updatedAt: datetime = Field(..., description="Thời gian cập nhật")
    status: str = Field(..., description="Trạng thái cuộc hội thoại")
    messages: List[MessageSchema] = Field(..., description="Danh sách tin nhắn")
    message_count: Optional[int] = Field(None, description="Số lượng tin nhắn")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
        schema_extra = {
            "example": {
                "id": "60f7b1b9e4b0c8a2a0a1b2c3",
                "title": "Tìm vé Hà Nội - TP.HCM",
                "createdAt": "2025-01-03T09:00:00.000Z",
                "updatedAt": "2025-01-03T09:15:00.000Z",
                "status": "resolved",
                "message_count": 6,
                "messages": [
                    {
                        "id": "msg_001",
                        "role": "user",
                        "content": "Chào bạn, tôi muốn tìm vé xe từ Hà Nội đi TP.HCM",
                        "timestamp": "2025-01-03T09:00:00.000Z",
                    },
                    {
                        "id": "msg_002",
                        "role": "assistant",
                        "content": "Chào anh/chị! Tôi sẽ giúp anh/chị tìm vé xe...",
                        "timestamp": "2025-01-03T09:01:00.000Z",
                    },
                ],
            }
        }


class ChatHistoryListResponseSchema(BaseModel):
    """Schema cho response danh sách chat histories"""

    chat_histories: List[ChatHistoryResponseSchema] = Field(
        ..., description="Danh sách lịch sử chat"
    )
    total_count: int = Field(..., description="Tổng số bản ghi")
    limit: int = Field(..., description="Số bản ghi trên trang")
    offset: int = Field(..., description="Vị trí bắt đầu")
    has_more: bool = Field(..., description="Có còn dữ liệu không")

    class Config:
        schema_extra = {
            "example": {
                "chat_histories": [],
                "total_count": 50,
                "limit": 10,
                "offset": 0,
                "has_more": True,
            }
        }


class ChatHistorySearchSchema(BaseModel):
    """Schema để tìm kiếm chat histories"""

    query: Optional[str] = Field(
        None, description="Từ khóa tìm kiếm trong title hoặc content"
    )
    status: Optional[Literal["active", "resolved", "pending"]] = Field(
        None, description="Lọc theo trạng thái"
    )
    from_date: Optional[datetime] = Field(None, description="Tìm từ ngày")
    to_date: Optional[datetime] = Field(None, description="Tìm đến ngày")
    limit: int = Field(default=10, ge=1, le=100, description="Số bản ghi trên trang")
    offset: int = Field(default=0, ge=0, description="Vị trí bắt đầu")

    class Config:
        schema_extra = {
            "example": {
                "query": "tìm vé",
                "status": "resolved",
                "from_date": "2025-01-01T00:00:00.000Z",
                "to_date": "2025-01-31T23:59:59.999Z",
                "limit": 10,
                "offset": 0,
            }
        }


def validate_chat_history_data(data: dict, is_update: bool = False):
    """Validate chat history data với business rules"""
    errors = []

    if not is_update:
        # Required fields cho tạo mới
        required_fields = ["title"]
        for field in required_fields:
            if field not in data or not data[field]:
                errors.append(f"Missing required field: {field}")

    # Validate title
    if "title" in data and data["title"]:
        if len(data["title"]) > 200:
            errors.append("Title must not exceed 200 characters")

    # Validate status
    if "status" in data and data["status"]:
        valid_statuses = ["active", "resolved", "pending"]
        if data["status"] not in valid_statuses:
            errors.append(f"Invalid status. Must be one of: {valid_statuses}")

    # Validate messages
    if "messages" in data and data["messages"]:
        if not isinstance(data["messages"], list):
            errors.append("Messages must be a list")
        else:
            for i, message in enumerate(data["messages"]):
                if not isinstance(message, dict):
                    errors.append(f"Message at index {i} must be a dictionary")
                    continue

                # Validate required message fields
                required_msg_fields = ["id", "role", "content", "timestamp"]
                for field in required_msg_fields:
                    if field not in message:
                        errors.append(
                            f"Message at index {i} missing required field: {field}"
                        )

                # Validate role
                if "role" in message and message["role"] not in ["user", "assistant"]:
                    errors.append(
                        f"Message at index {i} has invalid role. Must be 'user' or 'assistant'"
                    )

    if errors:
        raise ValueError("; ".join(errors))

    return data


def serialize_chat_history(chat_history):
    """Convert MongoDB document to JSON serializable format"""
    if chat_history:
        chat_history["id"] = str(chat_history["_id"])
        del chat_history["_id"]

        # Convert datetime objects to ISO string format
        if "createdAt" in chat_history and isinstance(
            chat_history["createdAt"], datetime
        ):
            chat_history["createdAt"] = chat_history["createdAt"].isoformat()
        if "updatedAt" in chat_history and isinstance(
            chat_history["updatedAt"], datetime
        ):
            chat_history["updatedAt"] = chat_history["updatedAt"].isoformat()

        # Process messages timestamps
        if "messages" in chat_history and chat_history["messages"]:
            for message in chat_history["messages"]:
                if "timestamp" in message and isinstance(
                    message["timestamp"], datetime
                ):
                    message["timestamp"] = message["timestamp"].isoformat()

        # Add message count
        if "messages" in chat_history:
            chat_history["message_count"] = len(chat_history["messages"])

    return chat_history
