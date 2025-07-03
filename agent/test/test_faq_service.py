import unittest
from unittest.mock import patch, MagicMock
from typing import List, Dict
import os
import sys


sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
        )
    )
)

from src.services.faq_service import faq_rag_chat

mock_docs: List[Dict] = [
    {
        "question": "Tôi có thể nhận lại tiền hoàn trong bao lâu?",
        "answer": "Thông thường bạn sẽ nhận được tiền hoàn trong khoảng 1-14 ngày tùy phương thức thanh toán.",
        "category": "Hoàn tiền",
    }
]


class TestFaqRagChat(unittest.TestCase):
    @patch("src.services.faq_service.get_milvus_client")
    def test_faq_rag_chat_no_result(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.connected = True
        mock_client.embeddings = MagicMock()
        mock_client.embed_query.return_value = [0.1] * 1536
        mock_client.search_similar.return_value = []
        mock_get_client.return_value = mock_client

        response = faq_rag_chat("Tôi muốn huỷ vé nhưng chưa thanh toán")
        self.assertTrue(response["success"])
        self.assertEqual(response["relevant_docs_count"], 0)
        self.assertIn("không tìm thấy thông tin", response["message"])

    @patch("src.services.faq_service.get_milvus_client")
    @patch("src.services.faq_service.generate_answer_with_llm")
    def test_faq_rag_chat_found_result(self, mock_llm, mock_get_client):
        mock_client = MagicMock()
        mock_client.connected = True
        mock_client.embeddings = MagicMock()
        mock_client.embed_query.return_value = [0.1] * 1536
        mock_client.search_similar.return_value = mock_docs
        mock_get_client.return_value = mock_client

        # Mock LLM để trả về câu trả lời có chứa "tiền hoàn"
        mock_llm.return_value = "Bạn sẽ nhận được tiền hoàn trong khoảng 1-14 ngày tùy phương thức thanh toán."

        response = faq_rag_chat("Tôi nhận lại tiền hoàn trong bao lâu")
        self.assertTrue(response["success"])
        self.assertGreater(response["relevant_docs_count"], 0)
        self.assertIn("tiền hoàn", response["message"])

    @patch("src.services.faq_service.get_milvus_client")
    @patch("src.services.faq_service.generate_answer_with_llm")
    def test_all_questions_should_return_relevant_keyword(
        self, mock_llm, mock_get_client
    ):
        mock_client = MagicMock()
        mock_client.connected = True
        mock_client.embeddings = MagicMock()
        mock_client.embed_query.return_value = [0.1] * 1536
        mock_get_client.return_value = mock_client

        test_cases = [
            ("Tôi có thể nhận lại tiền hoàn trong bao lâu?", "tiền hoàn"),
            (
                "Sau khi hủy vé, tôi sẽ nhận được hoàn tiền bằng hình thức nào?",
                "phương thức thanh toán",
            ),
            ("Tôi có thể nhận tiền hoàn lại bằng tiền mặt được không?", "tiền mặt"),
            (
                "Vé chưa được xác nhận sau khi thanh toán thì phải làm sao?",
                "liên hệ tổng đài",
            ),
            ("Quy định cho phụ nữ mang thai khi đi máy bay", "phụ nữ mang thai"),
            ("Quy định mua vé tàu hỏa cho trẻ em", "trẻ em"),
        ]

        for question, expected_keyword in test_cases:
            # Mock LLM để trả về câu trả lời có chứa từ khóa mong đợi
            mock_llm.return_value = f"Dựa trên thông tin FAQ, {expected_keyword} là câu trả lời cho câu hỏi của bạn."

            mock_client.search_similar.return_value = [
                {
                    "question": question,
                    "answer": f"Câu trả lời mẫu có chứa từ khóa: {expected_keyword}",
                    "category": "test",
                }
            ]
            response = faq_rag_chat(question)
            self.assertTrue(response["success"])
            self.assertIn(
                expected_keyword, response["message"], f"Fail tại câu hỏi: {question}"
            )


if __name__ == "__main__":
    unittest.main()
