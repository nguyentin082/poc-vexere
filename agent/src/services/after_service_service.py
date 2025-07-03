import json
import re
import requests
from pprint import pprint
from datetime import datetime
from typing import Dict, Any

from src.core.config import BACKEND_URL
from src.utils.intent_classifier import AfterServiceIntentClassifier


def get_all_tickets():
    try:
        res = requests.get(f"{BACKEND_URL}/api/ticket")
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"Lỗi gọi API lấy danh sách vé: {e}")
    return []


def get_ticket_info(ticket_id: str) -> Dict:
    try:
        res = requests.get(f"{BACKEND_URL}/api/ticket/{ticket_id}")
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"Lỗi lấy thông tin vé {ticket_id}: {e}")
    return None


class AfterServiceHandler:
    """Handler for different after-service intents"""

    def __init__(self):
        self.classifier = AfterServiceIntentClassifier()
        self.session_state = {}

    def handle_change_schedule(self, message: str, entities: Dict) -> Dict:
        ticket_id = entities.get("ticket_code")
        changed_time = entities.get("schedule_time")

        # Validate required fields
        if not ticket_id:
            return {
                "message": message,
                "intent": "change_schedule",
                "response": "Vui lòng cung cấp mã vé (ví dụ: VX123456789).",
            }

        if not changed_time:
            return {
                "message": message,
                "intent": "change_schedule",
                "response": f"Bạn chưa cung cấp giờ muốn đổi cho vé {ticket_id}.",
            }

        # Check if ticket exists
        if not get_ticket_info(ticket_id):
            return {
                "message": message,
                "intent": "change_schedule",
                "response": f"Không tìm thấy vé {ticket_id}. Vui lòng kiểm tra lại mã vé.",
            }

        try:
            res = requests.put(
                f"{BACKEND_URL}/api/ticket/{ticket_id}",
                json={"time": changed_time},
            )
            if res.status_code == 200:
                return {
                    "message": message,
                    "intent": "change_schedule",
                    "response": f"Đã đổi giờ vé {ticket_id} sang {changed_time} thành công.",
                }
            else:
                return {
                    "message": message,
                    "intent": "change_schedule",
                    "response": "Không thể đổi giờ vé lúc này.",
                }
        except Exception as e:
            return {
                "message": message,
                "intent": "change_schedule",
                "response": f"Lỗi cập nhật vé: {e}",
            }

    def handle_cancel_ticket(self, message: str, entities: Dict) -> Dict:
        ticket_id = entities.get("ticket_code")

        if not ticket_code:
            return {
                "message": message,
                "intent": "cancel_ticket",
                "response": "Vui lòng cung cấp mã vé để hủy.",
            }

        ticket_info = get_ticket_info(ticket_id)
        if not ticket_info:
            return {
                "message": message,
                "intent": "cancel_ticket",
                "response": f"Không tìm thấy vé {ticket_id}. Vui lòng kiểm tra lại mã vé.",
            }

        try:
            res = requests.put(
                f"{BACKEND_URL}/api/ticket/{ticket_id}", json={"status": "cancelled"}
            )
            if res.status_code == 200:
                return {
                    "message": message,
                    "intent": "cancel_ticket",
                    "response": f"Vé {ticket_id} đã được hủy thành công.",
                }
            else:
                return {
                    "message": message,
                    "intent": "cancel_ticket",
                    "response": "Không thể hủy vé lúc này.",
                }
        except Exception as e:
            print(f"Lỗi hủy vé: {e}")
            return {
                "message": message,
                "intent": "cancel_ticket",
                "response": f"Lỗi hủy vé: {e}",
            }

    def handle_invoice_request(self, message: str, entities: Dict) -> Dict:
        ticket_id = entities.get("ticket_code")
        if not ticket_id:
            return {
                "message": message,
                "intent": "invoice_request",
                "response": "Bạn muốn xuất hóa đơn cho vé nào? Vui lòng cung cấp mã vé.",
            }

        return {
            "message": message,
            "intent": "invoice_request",
            "response": f"Chúng tôi đã tiếp nhận yêu cầu xuất hóa đơn cho vé {ticket_id}.",
        }

    def handle_complaint(self, message: str, entities: Dict) -> Dict:
        ticket_id = entities.get("ticket_code")
        reason = entities.get("reason")

        if not ticket_id:
            return {
                "message": message,
                "intent": "complaint",
                "response": "Vui lòng cung cấp mã vé để khiếu nại.",
            }
        if not reason:
            return {
                "message": message,
                "intent": "complaint",
                "response": f"Bạn chưa cung cấp lý do khiếu nại cho vé {ticket_id}.",
            }
        return {
            "message": message,
            "intent": "complaint",
            "response": f"Chúng tôi đã ghi nhận khiếu nại cho vé {ticket_id} với lý do: {reason}. Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.",
        }

    def handle_general_inquiry(self, message: str, entities: Dict) -> Dict:
        return {
            "message": message,
            "intent": "general_inquiry",
            "response": "Chúng tôi có thể hỗ trợ bạn:\n• Đổi giờ xe (vui lòng cung cấp mã vé và giờ mong muốn)\n• Hủy vé (vui lòng cung cấp mã vé)\n• Xuất hóa đơn (vui lòng cung cấp mã vé)\n• Khiếu nại dịch vụ (vui lòng cung cấp mã vé và lý do)\n\nBạn cần hỗ trợ gì?",
        }


def after_service_chat(message: str) -> Dict[str, Any]:
    try:
        handler = AfterServiceHandler()

        # TODO: Classify intent and entity from user message
        classification_result = handler.classifier.classify_intent(message)
        intent = classification_result["intent"]
        entities = classification_result.get("entities")

        # TODO: Choose handler based on intent
        if intent == "change_schedule":
            response = handler.handle_change_schedule(message, entities)
        elif intent == "cancel_ticket":
            response = handler.handle_cancel_ticket(message, entities)
        elif intent == "invoice_request":
            response = handler.handle_invoice_request(message, entities)
        elif intent == "complaint":
            response = handler.handle_complaint(message, entities)
        else:  # general_inquiry or any unrecognized intent
            response = handler.handle_general_inquiry(message, entities)

        # Add classification metadata
        response["classification"] = classification_result
        response["timestamp"] = datetime.now().isoformat()

        return response

    except Exception as e:
        return {
            "intent": "error",
            "response": "Xin lỗi, có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau.",
            "error": str(e),
            "classification": {
                "intent": "error",
                "confidence": 0.0,
                "entities": {},
            },
        }
