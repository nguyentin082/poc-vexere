import json
import re
from pprint import pprint
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from src.core.config import OPENAI_API_KEY


class AfterServiceIntentClassifier:
    """Intent classifier for after-service requests using LangChain"""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=OPENAI_API_KEY, model="gpt-4o-mini", temperature=0.1
        )

        self.intents = {
            "change_schedule": {
                "keywords": [
                    "đổi giờ",
                    "thay đổi giờ",
                    "chuyển giờ",
                    "đổi lịch",
                    "thay đổi thời gian",
                    "reschedule",
                ],
                "description": "Yêu cầu đổi giờ xe",
            },
            "cancel_ticket": {
                "keywords": [
                    "hủy vé",
                    "hủy đặt",
                    "cancel",
                    "không đi",
                    "hoàn tiền",
                    "trả vé",
                ],
                "description": "Yêu cầu hủy vé",
            },
            "invoice_request": {
                "keywords": [
                    "xuất hóa đơn",
                    "hóa đơn",
                    "invoice",
                    "VAT",
                    "công ty",
                    "hóa đơn điện tử",
                ],
                "description": "Yêu cầu xuất hóa đơn",
            },
            "complaint": {
                "keywords": [
                    "khiếu nại",
                    "phản ánh",
                    "complaint",
                    "không hài lòng",
                    "tồi tệ",
                    "báo cáo",
                ],
                "description": "Khiếu nại dịch vụ",
            },
        }

    def classify_intent(self, message: str) -> Dict[str, Any]:
        """Classify user intent using LangChain LLM"""

        system_prompt = f"""
        Bạn là một hệ thống phân loại ý định cho dịch vụ hỗ trợ sau bán hàng của VeXeRe.
        Nhiệm vụ của bạn là phân tích tin nhắn của khách hàng và xác định ý định chính.

        Các loại ý định có thể có:
        1. change_schedule: Đổi giờ xe, thay đổi lịch trình
        2. cancel_ticket: Hủy vé, hoàn tiền
        3. invoice_request: Xuất hóa đơn, yêu cầu hóa đơn VAT
        4. complaint: Khiếu nại, phản ánh dịch vụ
        5. general_inquiry: Các câu hỏi chung không thuộc các loại trên

        Trả về kết quả dưới dạng JSON với định dạng:
        {{
            "intent": "tên_ý_định",
            "entities": {{"ticket_code": "value", "schedule_time": "value", "reason": "value"}},
        }}

        Đối với "schedule_time" nếu có, phải tuân theo định dạng "hh:mm AM/PM"

        Chỉ trả về JSON, không giải thích thêm.
        """

        human_prompt = f"Phân tích tin nhắn sau: '{message}'"

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt),
            ]

            response = self.llm.invoke(messages)
            result = json.loads(response.content)
            pprint(result)
            return result

        except Exception as e:
            print(f"LLM classification error: {e}")
