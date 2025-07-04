# Code Review Guidelines - Vexere Project

## Overview

Code review guidelines for Vexere - AI-powered bus booking platform.

**Tech Stack:**

-   Frontend: Next.js 14 + TypeScript + Tailwind + shadcn/ui
-   AI Agent: FastAPI + LangChain + OpenAI + Milvus
-   Backend: FastAPI + MongoDB Atlas

## Code Style Conventions

### Frontend (TypeScript/React)

```typescript
// Components - PascalCase
export function TicketCard() {}

// Variables/Functions - camelCase
const ticketId = 'VX123456';
const handleSubmit = () => {};

// Custom hooks
export function useChatHistory() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    return { messages, setMessages };
}

// API calls with error handling
export async function sendChatMessage(message: string) {
    try {
        const response = await axios.post('/api/chat', { message });
        return response.data;
    } catch (error) {
        throw new Error('Failed to send message');
    }
}
```

### Backend (Python/FastAPI)

```python
# Classes - PascalCase
class ChatService:
    pass

# Functions/Variables - snake_case
def handle_chat():
    pass

# Route definition with error handling
@router.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response = await chat_service.process_message(request.message)
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

## Testing & CI

### Current Test Coverage

```
agent/test/
├── test_faq_service.py       # FAQ service tests
└── test_after_service.py     # After-service tests (32+ cases)
```

### Running Tests

```bash
# Run all agent tests
cd agent
python -m unittest discover test -v

# Run specific tests
python -m unittest test.test_after_service -v
```

### Test Patterns

```python
import unittest
from unittest.mock import patch
from src.services.after_service_service import AfterServiceService

class TestAfterServiceService(unittest.TestCase):
    def setUp(self):
        self.service = AfterServiceService()

    @patch('src.integrates.mongo.get_ticket_by_id')
    def test_change_schedule_valid_ticket(self, mock_get_ticket):
        mock_get_ticket.return_value = {'id': 'VX123456', 'status': 'active'}

        result = self.service.handle_change_schedule(
            "Change schedule for VX123456",
            {'ticket_ids': ['VX123456']}
        )

        self.assertIn('schedule', result)
```

### CI/CD TODO

-   [ ] GitHub Actions workflow
-   [ ] Automated testing on push
-   [ ] Code quality checks (ESLint, Prettier, Black)
-   [ ] Deployment automation

## Current Limitations

### 1. Entity Extraction

**Issue:** Basic regex pattern matching

```python
# Current - Simple regex
ticket_pattern = r'\b[A-Z]{2}\d{6}\b'

# Should be - NLP-based extraction
import spacy
nlp = spacy.load("vi_core_news_sm")
```

### 2. Error Handling

**Issue:** Generic try-catch blocks

```python
# Current
try:
    # operation
except Exception as e:
    return "Sorry, an error occurred"

# Should be
class TicketNotFoundError(Exception):
    pass

try:
    # operation
except TicketNotFoundError:
    return "Ticket not found. Please check your ticket ID."
```

### 3. No Session Management

-   Each message processed independently
-   No conversation context
-   Cannot handle multi-turn conversations

### 4. No Caching

-   All requests hit database
-   No FAQ response caching
-   OpenAI API calls not cached

### 5. Basic Authentication

-   All endpoints are public
-   No user identification
-   Chat history not tied to users

## Future Expansion Roadmap

### High Priority (1-2 weeks)

-   [ ] NLP-based entity extraction with spaCy
-   [ ] Input validation with Pydantic
-   [ ] Specific error types and handling
-   [ ] Basic response caching with Redis

### Medium Priority (1-2 months)

-   [ ] Session management with Redis
-   [ ] Structured logging and monitoring
-   [ ] Frontend automated tests (Jest + Playwright)
-   [ ] JWT authentication

### Low Priority (3+ months)

-   [ ] Multi-language support
-   [ ] Voice integration
-   [ ] Microservices architecture
-   [ ] Advanced analytics dashboard

## Quality Standards

### Code Quality Targets

-   Test Coverage: 90%+
-   Code Duplication: <3%
-   Performance Score: 90/100
-   Zero critical security vulnerabilities

### Review Checklist

-   [ ] Code follows naming conventions
-   [ ] All tests pass
-   [ ] Error handling is comprehensive
-   [ ] No console.log/print in production
-   [ ] Security considerations addressed
-   [ ] Documentation updated

---

**Status:** MVP Complete | **Next Focus:** Error Handling & Reliability
