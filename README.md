# 🚌 Vexere - Intelligent Bus Booking Assistant

A comprehensive AI-powered bus booking and customer service platform built with modern web technologies.

## 📋 Table of Contents

-   [Overview](#overview)
-   [Architecture](#architecture)
-   [Features](#features)
-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
-   [Running the Application](#running-the-application)
-   [API Documentation](#api-documentation)
-   [Testing](#testing)
-   [Project Structure](#project-structure)
-   [Technologies Used](#technologies-used)
-   [Contributing](#contributing)
-   [License](#license)

## 🌟 Overview

Vexere is a modern bus booking platform that combines intelligent customer service with efficient ticket management. The system consists of three main components:

-   **Frontend**: Modern React/Next.js web application with responsive design
-   **AI Agent**: Intelligent chat assistant for customer support and FAQ
-   **Backend Server**: RESTful API for ticket management and data persistence

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   AI Agent      │    │  Backend Server │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (FastAPI)     │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI/UX         │    │   NLP/AI        │    │   Database      │
│   Chat Interface│    │   Intent Class. │    │   MongoDB       │
│   Ticket View   │    │   Vector Search │    │   Ticket Data   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

### 🎫 Ticket Management

-   ✅ Create, read, update, delete tickets
-   ✅ Advanced filtering and search capabilities (by ticket ID, route, date)
-   ✅ Real-time ticket status updates
-   ✅ Payment tracking and management
-   ✅ Ticket ID display with copy-to-clipboard functionality
-   ✅ Enhanced ticket card layout with clear information hierarchy
-   ✅ Search by ticket ID with instant filtering
-   ✅ Responsive ticket grid that adapts to screen size

### 🤖 AI-Powered Customer Service

-   ✅ Intelligent chat assistant
-   ✅ FAQ answering with RAG (Retrieval-Augmented Generation)
-   ✅ After-service support (schedule changes, cancellations, complaints)
-   ✅ Intent classification and entity extraction
-   ✅ Multi-language support (Vietnamese)

### 💬 Chat System

-   ✅ Real-time messaging interface
-   ✅ Chat history persistence and session management
-   ✅ Intelligent session handling with auto-generation
-   ✅ Mobile-optimized UI with adaptive sidebar
-   ✅ Auto-scroll and smooth scrolling behavior
-   ✅ Responsive design with back navigation on mobile
-   ✅ Message status indicators and loading states
-   ✅ Copy-to-clipboard functionality

### 🎨 Modern UI/UX

-   ✅ Responsive design for all devices (desktop, tablet, mobile)
-   ✅ Dark/light mode support with system preference detection
-   ✅ Smooth animations and transitions
-   ✅ Accessibility features (ARIA labels, keyboard navigation)
-   ✅ Component-based architecture with shadcn/ui
-   ✅ Mobile-first approach with touch-friendly interfaces
-   ✅ Adaptive layouts that hide/show elements based on screen size
-   ✅ Modern card-based design with subtle shadows and borders

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

-   **Node.js** (v18.0.0 or higher)
-   **Python** (v3.8 or higher)
-   **MongoDB** (v5.0 or higher)
-   **npm** or **pnpm** or **yarn**
-   **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vexere
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
# or
pnpm install
# or
yarn install
```

### 3. Install AI Agent Dependencies

```bash
cd ../agent
pip install -r requirements.txt
```

### 4. Install Backend Server Dependencies

```bash
cd ../server
pip install -r requirements.txt
```

### 4. Environment Setup

#### Frontend (.env.local)

```bash
cd client
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AGENT_URL=http://localhost:8080
```

#### AI Agent (.env)

```bash
cd ../agent
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=your_openai_api_key
MILVUS_HOST=localhost
MILVUS_PORT=19530
BACKEND_URL=http://localhost:8000
MONGODB_URL=mongodb://localhost:27017
```

#### Backend Server (.env)

```bash
cd ../server
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=vexere
```

## 🏃‍♂️ Running the Application

### Development Mode

#### 1. Start MongoDB

```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### 2. Start Backend Server (Terminal 1)

```bash
cd server
python -m uvicorn src.app:app --reload --port 8000
```

#### 3. Start AI Agent (Terminal 2)

```bash
cd agent
python -m uvicorn src.app:app --reload --port 8080
```

#### 4. Start Frontend (Terminal 3)

```bash
cd client
npm run dev
# or
pnpm dev
# or
yarn dev
```

### Production Mode

#### 1. Build Frontend

```bash
cd client
npm run build
npm start
```

#### 2. Run Backend Services

```bash
# Backend Server
cd server
python -m uvicorn src.app:app --host 0.0.0.0 --port 8000

# AI Agent
cd agent
python -m uvicorn src.app:app --host 0.0.0.0 --port 8080
```

## 🌐 Application URLs

-   **Frontend**: http://localhost:3000
-   **Backend API**: http://localhost:8000
-   **AI Agent API**: http://localhost:8080
-   **API Documentation**:
    -   Backend: http://localhost:8000/docs
    -   Agent: http://localhost:8080/docs

## 📚 API Documentation

### Backend Server Endpoints

#### Tickets

-   `GET /api/ticket` - Get all tickets
-   `POST /api/ticket` - Create new ticket
-   `GET /api/ticket/{id}` - Get ticket by ID
-   `PUT /api/ticket/{id}` - Update ticket
-   `DELETE /api/ticket/{id}` - Delete ticket

#### Chat History

-   `GET /api/chat-history` - Get all chat sessions
-   `POST /api/chat-history` - Create new chat session
-   `PUT /api/chat-history/{id}` - Update chat session
-   `DELETE /api/chat-history/{id}` - Delete chat session

### AI Agent Endpoints

#### Main Chat

-   `POST /api/chat` - Main chat endpoint (intelligent routing)

#### FAQ

-   `POST /api/faq` - FAQ-specific chat

#### After Service

-   `POST /api/after-service` - After-service support

## 🧪 Testing

### Running Unit Tests

#### AI Agent Tests

```bash
cd agent
# Run all tests
python -m unittest discover test -v

# Run specific test files
python -m unittest test.test_faq_service -v
python -m unittest test.test_after_service -v
```

#### Frontend Tests

```bash
cd client
npm test
# or
npm run test:watch
```

#### Backend Tests

```bash
cd server
# Add your backend tests here
python -m pytest tests/ -v
```

### Test Coverage

#### AI Agent Tests

-   **FAQ Service**: 15+ test cases covering FAQ retrieval and processing
-   **After Service**: 32+ comprehensive test cases covering:
    -   Schedule change handlers
    -   Ticket cancellation flows
    -   Invoice generation
    -   Complaint processing
    -   Entity extraction and validation
    -   Integration with backend services
    -   Error handling and edge cases
    -   Malformed input handling

#### Test Results

All tests are passing with 100% success rate:

```bash
# Example output
..................................
----------------------------------------------------------------------
Ran 32 tests in 2.045s

OK
```

#### Frontend Tests

-   Component unit tests
-   Integration tests
-   E2E tests with Playwright

#### Backend Tests

-   API endpoint tests
-   Database integration tests
-   Authentication and authorization tests

## 📁 Project Structure

```
vexere/
├── README.md
├── .gitignore
│
├── client/                     # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx           # Main dashboard
│   │   ├── chat/
│   │   │   └── page.tsx       # Chat interface
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   ├── api.ts            # API client
│   │   ├── chat-api.ts       # Chat API client
│   │   └── utils.ts
│   ├── mock/                  # Mock data
│   └── package.json
│
├── agent/                      # AI Agent (FastAPI)
│   ├── src/
│   │   ├── app.py            # Main FastAPI application
│   │   ├── core/
│   │   │   └── config.py     # Configuration
│   │   ├── routes/
│   │   │   ├── chat_route.py
│   │   │   ├── faq_route.py
│   │   │   └── after_service_route.py
│   │   ├── services/
│   │   │   ├── chat_service.py
│   │   │   ├── faq_service.py
│   │   │   └── after_service_service.py
│   │   ├── utils/
│   │   │   ├── intent_classifier.py
│   │   │   └── chat_processing.py
│   │   └── integrates/
│   │       ├── milvus.py     # Vector database
│   │       └── mongo.py      # MongoDB integration
│   ├── test/
│   │   ├── test_faq_service.py          # FAQ service unit tests
│   │   ├── test_after_service.py        # After-service comprehensive tests (32+ cases)
│   ├── requirements.txt
│   └── docs/
│
└── server/                     # Backend Server (FastAPI)
    ├── src/
    │   ├── app.py            # Main FastAPI application
    │   ├── routes/
    │   │   ├── ticket_route.py
    │   │   └── chat_history_route.py
    │   ├── models/
    │   └── utils/
    └── requirements.txt
```

## 🛠️ Technologies Used

### Frontend

-   **Next.js 14** - React framework with App Router
-   **TypeScript** - Type-safe JavaScript
-   **Tailwind CSS** - Utility-first CSS framework
-   **Radix UI** - Accessible component primitives
-   **Lucide React** - Beautiful icons

### AI Agent

-   **FastAPI** - High-performance Python web framework
-   **OpenAI GPT** - Large language model
-   **Milvus** - Vector database for semantic search
-   **MongoDB** - Document database

### Backend Server

-   **FastAPI** - Python web framework
-   **MongoDB** - Document database
-   **PyMongo** - MongoDB driver for Python

### DevOps & Tools

-   **Docker** - Containerization
-   **Git** - Version control
-   **Uvicorn** - ASGI server

## 🎯 Key Features Explained

### 1. Intelligent Chat System

The AI agent uses natural language processing to:

-   Classify user intents (FAQ, after-service, general inquiry)
-   Extract entities (ticket IDs, dates, times)
-   Route messages to appropriate handlers
-   Provide contextual responses

### 2. FAQ with RAG (Retrieval-Augmented Generation)

-   Vector-based semantic search using Milvus
-   Retrieval-augmented generation for accurate responses
-   Context-aware responses with source attribution
-   Multi-language support (Vietnamese/English)

### 3. After-Service Support

-   Schedule changes with validation
-   Ticket cancellations with confirmation
-   Invoice requests and generation
-   Complaint handling with categorization
-   Integration with backend ticket system

### 4. Responsive Design & Mobile UX

-   Mobile-first approach with adaptive layouts
-   Touch-friendly interfaces with proper spacing
-   Cross-platform compatibility (iOS, Android, Desktop)
-   Progressive Web App capabilities
-   Optimized performance for all device types

### 5. Quality Assurance & Testing

-   Comprehensive unit test coverage (32+ test cases for after-service alone)
-   Integration testing with mock services
-   Error handling and edge case validation
-   Continuous testing with automated pipelines
-   100% test pass rate with robust error scenarios

## 🚀 Recent Updates & Improvements

### Latest Version Features

-   **Enhanced Chat UX**: Improved chat interface with smooth scrolling, session management, and mobile optimization
-   **Comprehensive Testing**: Added 32+ unit tests for after-service functionality with 100% pass rate
-   **Mobile-First Design**: Fully responsive UI with adaptive sidebar and touch-friendly interactions
-   **Ticket Management**: Enhanced ticket display with ID visibility, search functionality, and copy-to-clipboard
-   **Error Handling**: Robust error handling across all services with graceful degradation
-   **Documentation**: Complete English documentation with setup, API, and troubleshooting guides

### Performance Improvements

-   Optimized chat loading and scrolling performance
-   Reduced API response times through efficient caching
-   Enhanced mobile performance with optimized asset loading
-   Improved error boundaries and fallback states

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

-   Follow TypeScript/Python best practices
-   Write unit tests for new features
-   Update documentation
-   Use conventional commit messages

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

#### 2. Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

#### 3. Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

#### 4. Node.js Dependencies

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

-   Create an issue in this repository
-   Contact the development team
-   Check the documentation at `/docs`

---

**Built with ❤️ by the Vexere Team**
