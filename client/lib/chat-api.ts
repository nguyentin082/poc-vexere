// Chat API service
const CHAT_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AGENT_API_BASE_URL =
    process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8080';

export interface ChatApiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string | { $date: string };
    attachments?: Array<{
        type: 'image' | 'audio';
        url: string;
        name: string;
    }>;
}

export interface ChatApiSession {
    _id?: string;
    title: string;
    createdAt?: string | { $date: string };
    updatedAt?: string | { $date: string };
    status: 'active' | 'resolved' | 'pending';
    messages: ChatApiMessage[];
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'resolved' | 'pending';
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    attachments?: Array<{
        type: 'image' | 'audio';
        url: string;
        name: string;
    }>;
}

export interface ChatRequest {
    chat_id?: string;
    message: string;
}

export interface ChatResponse {
    success?: boolean;
    data?: {
        messages: ChatMessage[];
        chat_id: string;
    };
    // Alternative format from backend
    message?: string;
    response?: string;
    user_question?: string;
    relevant_docs_count?: number;
    chat_id?: string;
    error?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

// Helper function to convert MongoDB date format to ISO string
const convertDate = (date: string | { $date: string } | undefined): string => {
    if (!date) {
        return new Date().toISOString();
    }
    if (typeof date === 'string') {
        return date;
    }
    if (date && typeof date === 'object' && date.$date) {
        return date.$date;
    }
    // Fallback for unexpected formats
    return new Date().toISOString();
};

// Helper function to transform API response to frontend format
const transformChatSession = (apiSession: ChatApiSession): ChatSession => {
    // Ensure we use the actual _id from database, not a generated one
    const id = apiSession._id;
    if (!id) {
        console.warn('Chat session missing _id:', apiSession);
    }

    return {
        id: id || Math.random().toString(36).substr(2, 9), // Fallback only for display
        title: apiSession.title,
        createdAt: convertDate(apiSession.createdAt),
        updatedAt: convertDate(apiSession.updatedAt),
        status: apiSession.status,
        messages: apiSession.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: convertDate(msg.timestamp),
            attachments: msg.attachments,
        })),
    };
};

export const chatApi = {
    // Get all chat sessions
    getChatHistory: async (): Promise<ApiResponse<ChatSession[]>> => {
        try {
            const response = await fetch(
                `${CHAT_API_BASE_URL}/api/chat-history?t=${Date.now()}`, // Add timestamp to prevent caching
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache', // Prevent caching
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            // Check if server returns wrapped response or direct array
            let chatSessions: ChatApiSession[];
            if (responseData.success !== undefined && responseData.data) {
                // Server returns wrapped response: { success: true, data: [...] }
                if (!responseData.success) {
                    return {
                        success: false,
                        data: [],
                        error:
                            responseData.error ||
                            'Server returned success: false',
                    };
                }
                chatSessions = responseData.data;
            } else if (Array.isArray(responseData)) {
                // Server returns direct array: [...]
                chatSessions = responseData;
            } else {
                throw new Error('Invalid response format from server');
            }

            // Ensure we have an array to work with
            if (!Array.isArray(chatSessions)) {
                throw new Error(
                    'Server did not return an array of chat sessions'
                );
            }

            // Transform the data to match frontend interface
            const transformedData = chatSessions.map(transformChatSession);

            return {
                success: true,
                data: transformedData,
            };
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return {
                success: false,
                data: [],
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },

    // Get a specific chat session by ID
    getChatSession: async (
        sessionId: string
    ): Promise<ApiResponse<ChatSession>> => {
        try {
            const response = await fetch(
                `${CHAT_API_BASE_URL}/api/chat-history/${sessionId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ChatApiSession = await response.json();
            const transformedData = transformChatSession(data);

            return {
                success: true,
                data: transformedData,
            };
        } catch (error) {
            console.error('Error fetching chat session:', error);
            return {
                success: false,
                data: {} as ChatSession,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },

    // Create a new chat session
    // NOTE: This function is not used by the refactored frontend.
    // The agent now handles conversation/session creation automatically.
    createChatSession: async (
        session: Omit<ChatApiSession, '_id'>
    ): Promise<ApiResponse<ChatSession>> => {
        try {
            const response = await fetch(
                `${CHAT_API_BASE_URL}/api/chat-history`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(session),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ChatApiSession = await response.json();
            const transformedData = transformChatSession(data);

            return {
                success: true,
                data: transformedData,
            };
        } catch (error) {
            console.error('Error creating chat session:', error);
            return {
                success: false,
                data: {} as ChatSession,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },

    // Update a chat session
    // NOTE: This function is not used by the refactored frontend.
    // The agent now handles conversation/session management automatically.
    updateChatSession: async (
        sessionId: string,
        updates: Partial<ChatApiSession>
    ): Promise<ApiResponse<ChatSession>> => {
        try {
            const response = await fetch(
                `${CHAT_API_BASE_URL}/api/chat-history/${sessionId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ChatApiSession = await response.json();
            const transformedData = transformChatSession(data);

            return {
                success: true,
                data: transformedData,
            };
        } catch (error) {
            console.error('Error updating chat session:', error);
            return {
                success: false,
                data: {} as ChatSession,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },

    // Delete a chat session
    deleteChatSession: async (
        sessionId: string
    ): Promise<ApiResponse<boolean>> => {
        try {
            // Validate sessionId format (should be MongoDB ObjectId)
            if (
                !sessionId ||
                sessionId.length !== 24 ||
                !/^[0-9a-fA-F]{24}$/.test(sessionId)
            ) {
                console.error('Invalid chat session ID format:', sessionId);
                return {
                    success: false,
                    data: false,
                    error: 'ID phiên chat không hợp lệ. Không thể xóa.',
                };
            }

            const response = await fetch(
                `${CHAT_API_BASE_URL}/api/chat-history/${sessionId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);

                // Handle specific error cases
                if (response.status === 404) {
                    return {
                        success: false,
                        data: false,
                        error: 'Phiên chat không tồn tại hoặc đã bị xóa.',
                    };
                }

                throw new Error(
                    `HTTP error! status: ${response.status}, message: ${errorText}`
                );
            }

            // Try to parse response, but handle cases where it might be empty
            let responseData;
            try {
                const text = await response.text();
                responseData = text ? JSON.parse(text) : {};
            } catch (parseError) {
                // If parsing fails, assume success for DELETE operations
                responseData = {};
            }

            return {
                success: true,
                data: true,
                message:
                    responseData.message || 'Chat session deleted successfully',
            };
        } catch (error) {
            console.error('Error deleting chat session:', error);
            return {
                success: false,
                data: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },

    // Send a chat message
    sendChatMessage: async (
        request: ChatRequest
    ): Promise<ApiResponse<{ messages: ChatMessage[]; chat_id: string }>> => {
        try {
            const response = await fetch(`${AGENT_API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP error response:', errorText);
                throw new Error(
                    `HTTP error! status: ${response.status}, message: ${errorText}`
                );
            }

            const data: ChatResponse = await response.json();

            // Agent response doesn't always have 'success' field
            // If we get a 200 response with data, consider it successful
            const isSuccess =
                data.success !== false &&
                (data.message || data.response || data.data);

            if (!isSuccess) {
                return {
                    success: false,
                    data: { messages: [], chat_id: '' },
                    error: data.error || data.message || 'Chat request failed',
                };
            }

            // Handle different response formats
            if (data.data) {
                // Standard format with data object
                return {
                    success: true,
                    data: data.data,
                };
            } else if (data.message || data.response) {
                // Backend format with message/response directly
                const assistantMessage: ChatMessage = {
                    id: Math.random().toString(36).substr(2, 9),
                    role: 'assistant',
                    content: data.response || data.message || 'No response', // Try 'response' first, then 'message'
                    timestamp: new Date().toISOString(),
                };

                // Create user message from request
                const userMessage: ChatMessage = {
                    id: Math.random().toString(36).substr(2, 9),
                    role: 'user',
                    content: request.message,
                    timestamp: new Date().toISOString(),
                };

                return {
                    success: true,
                    data: {
                        messages: [userMessage, assistantMessage],
                        chat_id:
                            data.chat_id ||
                            request.chat_id ||
                            Math.random().toString(36).substr(2, 9),
                    },
                };
            }

            // Fallback
            return {
                success: true,
                data: {
                    messages: [],
                    chat_id: request.chat_id || '',
                },
            };
        } catch (error) {
            console.error('Error sending chat message:', error);
            return {
                success: false,
                data: { messages: [], chat_id: '' },
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
};
