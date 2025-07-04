import unittest
from unittest.mock import patch, MagicMock
import json
import sys
import os

# Add the parent directory to sys.path to import from src
sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
        )
    )
)

from src.services.after_service_service import (
    after_service_chat,
    get_all_tickets,
    get_ticket_info,
    AfterServiceHandler,
)


class TestAfterServiceUtils(unittest.TestCase):
    """Test utility functions"""

    @patch("src.services.after_service_service.requests.get")
    def test_get_all_tickets_success(self, mock_get):
        # Mock successful API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"id": "VX123456789", "status": "confirmed"},
            {"id": "VX987654321", "status": "pending"},
        ]
        mock_get.return_value = mock_response

        result = get_all_tickets()
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["id"], "VX123456789")

    @patch("src.services.after_service_service.requests.get")
    def test_get_all_tickets_failure(self, mock_get):
        # Mock API failure
        mock_get.side_effect = Exception("Connection error")

        result = get_all_tickets()
        self.assertEqual(result, [])

    @patch("src.services.after_service_service.requests.get")
    def test_get_ticket_info_success(self, mock_get):
        # Mock successful API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "VX123456789",
            "status": "confirmed",
            "time": "08:00",
        }
        mock_get.return_value = mock_response

        result = get_ticket_info("VX123456789")
        self.assertIsNotNone(result)
        self.assertEqual(result["id"], "VX123456789")

    @patch("src.services.after_service_service.requests.get")
    def test_get_ticket_info_not_found(self, mock_get):
        # Mock ticket not found
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        result = get_ticket_info("INVALID_ID")
        self.assertIsNone(result)

    @patch("src.services.after_service_service.requests.get")
    def test_get_ticket_info_api_error(self, mock_get):
        # Mock API error
        mock_get.side_effect = Exception("API Error")

        result = get_ticket_info("VX123456789")
        self.assertIsNone(result)


class TestAfterServiceHandler(unittest.TestCase):
    """Test AfterServiceHandler class"""

    def setUp(self):
        # Mock the classifier to avoid dependency issues
        with patch("src.services.after_service_service.AfterServiceIntentClassifier"):
            self.handler = AfterServiceHandler()

    def test_handle_change_schedule_missing_ticket_id(self):
        message = "Tôi muốn đổi giờ xe"
        entities = {"schedule_time": "10:00"}

        result = self.handler.handle_change_schedule(message, entities)

        self.assertEqual(result["intent"], "change_schedule")
        self.assertIn("mã vé", result["response"])

    def test_handle_change_schedule_missing_time(self):
        message = "Tôi muốn đổi giờ xe VX123456789"
        entities = {"ticket_code": "VX123456789"}

        result = self.handler.handle_change_schedule(message, entities)

        self.assertEqual(result["intent"], "change_schedule")
        self.assertIn("giờ muốn đổi", result["response"])

    @patch("src.services.after_service_service.get_ticket_info")
    def test_handle_change_schedule_ticket_not_found(self, mock_get_ticket):
        mock_get_ticket.return_value = None

        message = "Đổi giờ vé VX123456789 sang 10:00"
        entities = {"ticket_code": "VX123456789", "schedule_time": "10:00"}

        result = self.handler.handle_change_schedule(message, entities)

        self.assertEqual(result["intent"], "change_schedule")
        self.assertIn("Không tìm thấy vé", result["response"])

    @patch("src.services.after_service_service.requests.put")
    @patch("src.services.after_service_service.get_ticket_info")
    def test_handle_change_schedule_success(self, mock_get_ticket, mock_put):
        # Mock ticket exists
        mock_get_ticket.return_value = {"id": "VX123456789", "status": "confirmed"}

        # Mock successful API update
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_put.return_value = mock_response

        message = "Đổi giờ vé VX123456789 sang 10:00"
        entities = {"ticket_code": "VX123456789", "schedule_time": "10:00"}

        result = self.handler.handle_change_schedule(message, entities)

        self.assertEqual(result["intent"], "change_schedule")
        self.assertIn("thành công", result["response"])
        self.assertIn("VX123456789", result["response"])
        self.assertIn("10:00", result["response"])

    @patch("src.services.after_service_service.requests.put")
    @patch("src.services.after_service_service.get_ticket_info")
    def test_handle_change_schedule_api_failure(self, mock_get_ticket, mock_put):
        # Mock ticket exists
        mock_get_ticket.return_value = {"id": "VX123456789", "status": "confirmed"}

        # Mock API failure
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_put.return_value = mock_response

        message = "Đổi giờ vé VX123456789 sang 10:00"
        entities = {"ticket_code": "VX123456789", "schedule_time": "10:00"}

        result = self.handler.handle_change_schedule(message, entities)

        self.assertEqual(result["intent"], "change_schedule")
        self.assertIn("Không thể đổi giờ", result["response"])

    def test_handle_cancel_ticket_missing_ticket_id(self):
        message = "Tôi muốn hủy vé"
        entities = {}

        result = self.handler.handle_cancel_ticket(message, entities)

        self.assertEqual(result["intent"], "cancel_ticket")
        self.assertIn("mã vé", result["response"])

    @patch("src.services.after_service_service.get_ticket_info")
    def test_handle_cancel_ticket_not_found(self, mock_get_ticket):
        mock_get_ticket.return_value = None

        message = "Hủy vé VX123456789"
        entities = {"ticket_code": "VX123456789"}

        result = self.handler.handle_cancel_ticket(message, entities)

        self.assertEqual(result["intent"], "cancel_ticket")
        self.assertIn("Không tìm thấy vé", result["response"])

    @patch("src.services.after_service_service.requests.put")
    @patch("src.services.after_service_service.get_ticket_info")
    def test_handle_cancel_ticket_success(self, mock_get_ticket, mock_put):
        # Mock ticket exists
        mock_get_ticket.return_value = {"id": "VX123456789", "status": "confirmed"}

        # Mock successful cancellation
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_put.return_value = mock_response

        message = "Hủy vé VX123456789"
        entities = {"ticket_code": "VX123456789"}

        result = self.handler.handle_cancel_ticket(message, entities)

        self.assertEqual(result["intent"], "cancel_ticket")
        self.assertIn("hủy thành công", result["response"])
        self.assertIn("VX123456789", result["response"])

    def test_handle_invoice_request_missing_ticket_id(self):
        message = "Tôi muốn xuất hóa đơn"
        entities = {}

        result = self.handler.handle_invoice_request(message, entities)

        self.assertEqual(result["intent"], "invoice_request")
        self.assertIn("mã vé", result["response"])

    def test_handle_invoice_request_success(self):
        message = "Xuất hóa đơn cho vé VX123456789"
        entities = {"ticket_code": "VX123456789"}

        result = self.handler.handle_invoice_request(message, entities)

        self.assertEqual(result["intent"], "invoice_request")
        self.assertIn("tiếp nhận yêu cầu", result["response"])
        self.assertIn("VX123456789", result["response"])

    def test_handle_complaint_missing_ticket_id(self):
        message = "Tôi muốn khiếu nại"
        entities = {"reason": "Tài xế không lịch sự"}

        result = self.handler.handle_complaint(message, entities)

        self.assertEqual(result["intent"], "complaint")
        self.assertIn("mã vé", result["response"])

    def test_handle_complaint_missing_reason(self):
        message = "Khiếu nại vé VX123456789"
        entities = {"ticket_code": "VX123456789"}

        result = self.handler.handle_complaint(message, entities)

        self.assertEqual(result["intent"], "complaint")
        self.assertIn("lý do khiếu nại", result["response"])

    def test_handle_complaint_success(self):
        message = "Khiếu nại vé VX123456789 vì tài xế không lịch sự"
        entities = {"ticket_code": "VX123456789", "reason": "tài xế không lịch sự"}

        result = self.handler.handle_complaint(message, entities)

        self.assertEqual(result["intent"], "complaint")
        self.assertIn("ghi nhận khiếu nại", result["response"])
        self.assertIn("VX123456789", result["response"])
        self.assertIn("tài xế không lịch sự", result["response"])

    def test_handle_general_inquiry(self):
        message = "Bạn có thể hỗ trợ gì?"
        entities = {}

        result = self.handler.handle_general_inquiry(message, entities)

        self.assertEqual(result["intent"], "general_inquiry")
        self.assertIn("Đổi giờ xe", result["response"])
        self.assertIn("Hủy vé", result["response"])
        self.assertIn("Xuất hóa đơn", result["response"])
        self.assertIn("Khiếu nại", result["response"])


class TestAfterServiceChat(unittest.TestCase):
    """Test main after_service_chat function"""

    @patch("src.services.after_service_service.save_message_to_chat")
    @patch("src.services.after_service_service.AfterServiceHandler")
    def test_after_service_chat_change_schedule(self, mock_handler_class, mock_save):
        # Mock handler instance and its methods
        mock_handler = MagicMock()
        mock_handler.classifier.classify_intent.return_value = {
            "intent": "change_schedule",
            "confidence": 0.95,
            "entities": {"ticket_code": "VX123456789", "schedule_time": "10:00"},
        }
        mock_handler.handle_change_schedule.return_value = {
            "message": "Đổi giờ vé VX123456789 sang 10:00",
            "intent": "change_schedule",
            "response": "Đã đổi giờ vé VX123456789 sang 10:00 thành công.",
        }
        mock_handler_class.return_value = mock_handler

        message = "Đổi giờ vé VX123456789 sang 10:00"
        chat_id = "chat_123"

        result = after_service_chat(message, chat_id)

        # Verify response structure
        self.assertIn("intent", result)
        self.assertIn("response", result)
        self.assertIn("classification", result)
        self.assertIn("timestamp", result)
        self.assertIn("chat_id", result)
        self.assertEqual(result["chat_id"], chat_id)
        self.assertEqual(result["intent"], "change_schedule")

        # Verify handler was called correctly
        mock_handler.classifier.classify_intent.assert_called_once_with(message)
        mock_handler.handle_change_schedule.assert_called_once()

    @patch("src.services.after_service_service.save_message_to_chat")
    @patch("src.services.after_service_service.AfterServiceHandler")
    def test_after_service_chat_cancel_ticket(self, mock_handler_class, mock_save):
        # Mock handler for cancel ticket
        mock_handler = MagicMock()
        mock_handler.classifier.classify_intent.return_value = {
            "intent": "cancel_ticket",
            "confidence": 0.90,
            "entities": {"ticket_code": "VX123456789"},
        }
        mock_handler.handle_cancel_ticket.return_value = {
            "message": "Hủy vé VX123456789",
            "intent": "cancel_ticket",
            "response": "Vé VX123456789 đã được hủy thành công.",
        }
        mock_handler_class.return_value = mock_handler

        message = "Hủy vé VX123456789"
        result = after_service_chat(message)

        self.assertEqual(result["intent"], "cancel_ticket")
        mock_handler.handle_cancel_ticket.assert_called_once()

    @patch("src.services.after_service_service.save_message_to_chat")
    @patch("src.services.after_service_service.AfterServiceHandler")
    def test_after_service_chat_general_inquiry(self, mock_handler_class, mock_save):
        # Mock handler for general inquiry (default case)
        mock_handler = MagicMock()
        mock_handler.classifier.classify_intent.return_value = {
            "intent": "unknown",
            "confidence": 0.30,
            "entities": {},
        }
        mock_handler.handle_general_inquiry.return_value = {
            "message": "Bạn có thể hỗ trợ gì?",
            "intent": "general_inquiry",
            "response": "Chúng tôi có thể hỗ trợ bạn...",
        }
        mock_handler_class.return_value = mock_handler

        message = "Bạn có thể hỗ trợ gì?"
        result = after_service_chat(message)

        self.assertEqual(result["intent"], "general_inquiry")
        mock_handler.handle_general_inquiry.assert_called_once()

    @patch("src.services.after_service_service.save_message_to_chat")
    @patch("src.services.after_service_service.AfterServiceHandler")
    def test_after_service_chat_with_exception(self, mock_handler_class, mock_save):
        # Mock an exception during processing
        mock_handler_class.side_effect = Exception("Classification error")

        message = "Test message"
        chat_id = "chat_123"

        result = after_service_chat(message, chat_id)

        # Verify error response
        self.assertEqual(result["intent"], "error")
        self.assertIn("error", result)
        self.assertIn("Xin lỗi", result["response"])
        self.assertEqual(result["chat_id"], chat_id)

    def test_after_service_chat_multiple_intents(self):
        """Test that different intents are handled correctly"""
        test_cases = [
            {
                "message": "Đổi giờ vé VX123 sang 15:00",
                "expected_intent": "change_schedule",
                "entities": {"ticket_code": "VX123", "schedule_time": "15:00"},
            },
            {
                "message": "Hủy vé VX456",
                "expected_intent": "cancel_ticket",
                "entities": {"ticket_code": "VX456"},
            },
            {
                "message": "Xuất hóa đơn vé VX789",
                "expected_intent": "invoice_request",
                "entities": {"ticket_code": "VX789"},
            },
            {
                "message": "Khiếu nại vé VX101 vì xe đến muộn",
                "expected_intent": "complaint",
                "entities": {"ticket_code": "VX101", "reason": "xe đến muộn"},
            },
        ]

        for case in test_cases:
            with patch("src.services.after_service_service.save_message_to_chat"):
                with patch(
                    "src.services.after_service_service.AfterServiceHandler"
                ) as mock_handler_class:
                    # Setup mock handler
                    mock_handler = MagicMock()
                    mock_handler.classifier.classify_intent.return_value = {
                        "intent": case["expected_intent"],
                        "confidence": 0.95,
                        "entities": case["entities"],
                    }

                    # Mock the appropriate handler method
                    handler_method = f"handle_{case['expected_intent']}"
                    getattr(mock_handler, handler_method).return_value = {
                        "message": case["message"],
                        "intent": case["expected_intent"],
                        "response": f"Processed {case['expected_intent']}",
                    }
                    mock_handler_class.return_value = mock_handler

                    result = after_service_chat(case["message"])

                    # Verify the correct handler was called
                    self.assertEqual(result["intent"], case["expected_intent"])
                    getattr(mock_handler, handler_method).assert_called_once()


class TestAfterServiceIntegration(unittest.TestCase):
    """Integration tests for after service functionality"""

    @patch("src.services.after_service_service.save_message_to_chat")
    @patch("src.services.after_service_service.requests.put")
    @patch("src.services.after_service_service.get_ticket_info")
    @patch("src.services.after_service_service.AfterServiceHandler")
    def test_complete_change_schedule_flow(
        self, mock_handler_class, mock_get_ticket, mock_put, mock_save
    ):
        """Test the complete flow for changing schedule"""
        # Setup mocks
        mock_handler = MagicMock()
        mock_handler_class.return_value = mock_handler

        # Mock classifier
        mock_handler.classifier.classify_intent.return_value = {
            "intent": "change_schedule",
            "confidence": 0.95,
            "entities": {"ticket_code": "VX123456789", "schedule_time": "10:00"},
        }

        # Mock ticket exists
        mock_get_ticket.return_value = {"id": "VX123456789", "status": "confirmed"}

        # Mock successful API update
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_put.return_value = mock_response

        # Create real handler to test actual logic
        real_handler = AfterServiceHandler()
        mock_handler.handle_change_schedule = real_handler.handle_change_schedule

        message = "Đổi giờ vé VX123456789 sang 10:00"
        chat_id = "chat_123"

        result = after_service_chat(message, chat_id)

        # Verify the complete flow
        self.assertIn("intent", result)
        self.assertIn("response", result)
        self.assertIn("thành công", result["response"])
        self.assertIn("VX123456789", result["response"])
        self.assertIn("10:00", result["response"])

    @patch("src.services.after_service_service.save_message_to_chat")
    @patch("src.services.after_service_service.requests.put")
    @patch("src.services.after_service_service.get_ticket_info")
    @patch("src.services.after_service_service.AfterServiceHandler")
    def test_complete_cancel_ticket_flow(
        self, mock_handler_class, mock_get_ticket, mock_put, mock_save
    ):
        """Test the complete flow for canceling ticket"""
        # Setup mocks
        mock_handler = MagicMock()
        mock_handler_class.return_value = mock_handler

        # Mock classifier
        mock_handler.classifier.classify_intent.return_value = {
            "intent": "cancel_ticket",
            "confidence": 0.90,
            "entities": {"ticket_code": "VX123456789"},
        }

        # Mock ticket exists
        mock_get_ticket.return_value = {"id": "VX123456789", "status": "confirmed"}

        # Mock successful cancellation
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_put.return_value = mock_response

        # Create real handler to test actual logic
        real_handler = AfterServiceHandler()
        mock_handler.handle_cancel_ticket = real_handler.handle_cancel_ticket

        message = "Hủy vé VX123456789"
        chat_id = "chat_456"

        result = after_service_chat(message, chat_id)

        # Verify the complete flow
        self.assertEqual(result["chat_id"], chat_id)
        self.assertIn("hủy thành công", result["response"])
        self.assertIn("VX123456789", result["response"])

    def test_edge_cases_empty_entities(self):
        """Test edge cases with empty or malformed entities"""
        with patch(
            "src.services.after_service_service.AfterServiceHandler"
        ) as mock_handler_class:
            mock_handler = MagicMock()
            mock_handler_class.return_value = mock_handler

            # Test with empty entities
            mock_handler.classifier.classify_intent.return_value = {
                "intent": "change_schedule",
                "confidence": 0.50,
                "entities": {},  # Empty entities
            }

            real_handler = AfterServiceHandler()
            mock_handler.handle_change_schedule = real_handler.handle_change_schedule

            message = "Tôi muốn đổi giờ"
            result = after_service_chat(message)

            self.assertIn("mã vé", result["response"])

    def test_edge_cases_malformed_entities(self):
        """Test edge cases with malformed entities"""
        with patch("src.services.after_service_service.save_message_to_chat"):
            with patch(
                "src.services.after_service_service.AfterServiceHandler"
            ) as mock_handler_class:
                mock_handler = MagicMock()
                mock_handler_class.return_value = mock_handler

                # Test with None entities - should trigger exception handling
                mock_handler.classifier.classify_intent.return_value = {
                    "intent": "complaint",
                    "confidence": 0.80,
                    "entities": None,  # None entities
                }

                # Mock the handler to raise an exception
                mock_handler.handle_complaint.side_effect = Exception("NoneType error")

                message = "Tôi muốn khiếu nại"
                result = after_service_chat(message)

                # Should handle None entities gracefully and return error response
                self.assertEqual(result["intent"], "error")
                self.assertIn("Xin lỗi", result["response"])


class TestAfterServiceEdgeCases(unittest.TestCase):
    """Test edge cases and error scenarios"""

    def setUp(self):
        with patch("src.services.after_service_service.AfterServiceIntentClassifier"):
            self.handler = AfterServiceHandler()

    @patch("src.services.after_service_service.requests.put")
    @patch("src.services.after_service_service.get_ticket_info")
    def test_change_schedule_network_error(self, mock_get_ticket, mock_put):
        """Test network error during schedule change"""
        mock_get_ticket.return_value = {"id": "VX123456789", "status": "confirmed"}
        mock_put.side_effect = Exception("Network timeout")

        message = "Đổi giờ vé VX123456789 sang 10:00"
        entities = {"ticket_code": "VX123456789", "schedule_time": "10:00"}

        result = self.handler.handle_change_schedule(message, entities)

        self.assertEqual(result["intent"], "change_schedule")
        self.assertIn("Lỗi cập nhật vé", result["response"])

    @patch("src.services.after_service_service.requests.put")
    @patch("src.services.after_service_service.get_ticket_info")
    def test_cancel_ticket_network_error(self, mock_get_ticket, mock_put):
        """Test network error during ticket cancellation"""
        mock_get_ticket.return_value = {"id": "VX123456789", "status": "confirmed"}
        mock_put.side_effect = Exception("Connection refused")

        message = "Hủy vé VX123456789"
        entities = {"ticket_code": "VX123456789"}

        result = self.handler.handle_cancel_ticket(message, entities)

        self.assertEqual(result["intent"], "cancel_ticket")
        self.assertIn("Lỗi hủy vé", result["response"])

    def test_handle_entities_with_special_characters(self):
        """Test handling entities with special characters"""
        message = "Đổi giờ vé VX@123#456 sang 10:00"
        entities = {"ticket_code": "VX@123#456", "schedule_time": "10:00"}

        with patch(
            "src.services.after_service_service.get_ticket_info"
        ) as mock_get_ticket:
            mock_get_ticket.return_value = None  # Ticket not found

            result = self.handler.handle_change_schedule(message, entities)

            self.assertIn("Không tìm thấy vé", result["response"])
            self.assertIn("VX@123#456", result["response"])

    def test_handle_very_long_reason(self):
        """Test handling very long complaint reasons"""
        long_reason = (
            "Xe đến muộn 2 tiếng, tài xế không lịch sự, điều hòa hỏng, ghế không thoải mái, âm thanh quá to, "
            * 10
        )

        message = f"Khiếu nại vé VX123456789 vì {long_reason}"
        entities = {"ticket_code": "VX123456789", "reason": long_reason}

        result = self.handler.handle_complaint(message, entities)

        self.assertEqual(result["intent"], "complaint")
        self.assertIn("ghi nhận khiếu nại", result["response"])
        self.assertIn(long_reason, result["response"])


if __name__ == "__main__":
    unittest.main()
