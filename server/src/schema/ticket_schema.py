from typing import Optional
from datetime import datetime


class PaymentInfo:
    def __init__(self, done: bool = False, gate: str = ""):
        self.done = done
        self.gate = gate

    def to_dict(self):
        return {"done": self.done, "gate": self.gate}


class TicketSchema:
    def __init__(
        self,
        userName: str,
        type: str,
        date: str,
        time: str,
        fromLocation: str,
        toLocation: str,
        payment: PaymentInfo,
        createdAt: Optional[datetime] = None,
        updatedAt: Optional[datetime] = None,
    ):
        self.userName = userName
        self.type = type
        self.date = date
        self.time = time
        self.from_location = fromLocation
        self.to_location = toLocation
        self.payment = payment
        self.createdAt = createdAt or datetime.utcnow()
        self.updatedAt = updatedAt or datetime.utcnow()

    def to_dict(self):
        return {
            "userName": self.userName,
            "type": self.type,
            "date": self.date,
            "time": self.time,
            "from": self.from_location,
            "to": self.to_location,
            "payment": (
                self.payment.to_dict()
                if isinstance(self.payment, PaymentInfo)
                else self.payment
            ),
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt,
        }

    @classmethod
    def from_dict(cls, data: dict):
        payment_data = data.get("payment", {})
        payment = PaymentInfo(
            done=payment_data.get("done", False), gate=payment_data.get("gate", "")
        )

        return cls(
            userName=data.get("userName", ""),
            type=data.get("type", ""),
            date=data.get("date", ""),
            time=data.get("time", ""),
            from_location=data.get("from", ""),
            to_location=data.get("to", ""),
            payment=payment,
            createdAt=data.get("createdAt"),
            updatedAt=data.get("updatedAt"),
        )


def validate_ticket_data(data: dict) -> dict:
    """Validate and sanitize ticket data"""
    required_fields = ["userName", "type", "date", "time", "from", "to"]

    for field in required_fields:
        if field not in data or not data[field]:
            raise ValueError(f"Missing required field: {field}")

    # Validate type
    valid_types = ["bus", "train", "plane", "boat"]
    if data["type"] not in valid_types:
        raise ValueError(f"Invalid type. Must be one of: {valid_types}")

    # Validate payment
    if "payment" in data:
        payment = data["payment"]
        if not isinstance(payment, dict):
            raise ValueError("Payment must be a dictionary")

        if "done" in payment and not isinstance(payment["done"], bool):
            raise ValueError("Payment 'done' field must be a boolean")

        if "gate" in payment and not isinstance(payment["gate"], str):
            raise ValueError("Payment 'gate' field must be a string")

    return data
