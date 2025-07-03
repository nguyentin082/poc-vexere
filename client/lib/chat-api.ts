// Chat API service
const CHAT_API_BASE_URL = 'http://localhost:8000/api';

export interface ChatApiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string | { $date: string };
    attachments?: Array<{
        type: 'image' | 'audio';
        url: string;
        name: string;
    }>;
}

export interface ChatApiSession {
    _id?: string;
    title: string;
    createdAt: string | { $date: string };
    updatedAt: string | { $date: string };
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

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

// Helper function to convert MongoDB date format to ISO string
const convertDate = (date: string | { $date: string }): string => {
    if (typeof date === 'string') {
        return date;
    }
    return date.$date;
};

// Helper function to transform API response to frontend format
const transformChatSession = (apiSession: ChatApiSession): ChatSession => {
    return {
        id: apiSession._id || Math.random().toString(36).substr(2, 9),
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
            const response = await fetch(`${CHAT_API_BASE_URL}/chat-history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

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
                `${CHAT_API_BASE_URL}/chat-history/${sessionId}`,
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
    createChatSession: async (
        session: Omit<ChatApiSession, '_id'>
    ): Promise<ApiResponse<ChatSession>> => {
        try {
            const response = await fetch(`${CHAT_API_BASE_URL}/chat-history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(session),
            });

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
    updateChatSession: async (
        sessionId: string,
        updates: Partial<ChatApiSession>
    ): Promise<ApiResponse<ChatSession>> => {
        try {
            const response = await fetch(
                `${CHAT_API_BASE_URL}/chat-history/${sessionId}`,
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
            const response = await fetch(
                `${CHAT_API_BASE_URL}/chat-history/${sessionId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: true,
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
};
