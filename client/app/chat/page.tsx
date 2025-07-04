'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    MessageCircle,
    Send,
    Mic,
    MicOff,
    ImageIcon,
    Home,
    Bot,
    User,
    History,
    Trash2,
    Clock,
    CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { mockChatSessions, type ChatMessage, type ChatSession } from '@/mock';
import { chatApi } from '@/lib/chat-api';

export default function ChatPage() {
    // Replace useChat with local state management
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<string>('');

    const [files, setFiles] = useState<FileList | undefined>(undefined);
    const [isRecording, setIsRecording] = useState(false);
    const [activeTab, setActiveTab] = useState('new-chat');
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
        null
    );
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            const audioChunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        const userInput = input.trim();
        const userMessage: ChatMessage = {
            id: Math.random().toString(36).substr(2, 9),
            role: 'user',
            content: userInput,
            timestamp: new Date().toISOString(),
        };

        const isFirstMessage = messages.length === 0 && !selectedSession;
        const isSessionChat = !!selectedSession;
        const chatIdToUse = isSessionChat ? selectedSession.id : currentChatId;

        // Add user message to UI immediately for better UX
        if (isSessionChat) {
            // Update the selected session with the new user message
            setSelectedSession((prev) =>
                prev
                    ? {
                          ...prev,
                          messages: [...prev.messages, userMessage],
                          updatedAt: new Date().toISOString(),
                      }
                    : null
            );
        } else {
            // Add to local messages for new chat
            setMessages((prev) => [...prev, userMessage]);
        }

        setInput('');
        setIsLoading(true);

        try {
            // Call the agent API
            const response = await chatApi.sendChatMessage({
                chat_id: chatIdToUse || undefined,
                message: userInput,
            });

            if (response.success) {
                // Update chat_id if we got one from response for new chats
                if (response.data?.chat_id && !isSessionChat) {
                    setCurrentChatId(response.data.chat_id);
                }

                // DON'T update messages here - let fetchChatHistory handle all UI updates
                // This prevents double rendering

                // Refresh chat history to get the updated sessions from the agent
                // Single delayed fetch to ensure agent has saved to database
                setTimeout(async () => {
                    try {
                        await fetchChatHistory(true); // quiet refresh to avoid UI conflicts
                    } catch (fetchError) {
                        console.error(
                            'Error refreshing chat history:',
                            fetchError
                        );
                        // Retry once on error
                        setTimeout(async () => {
                            try {
                                await fetchChatHistory(true);
                            } catch (retryError) {
                                console.error(
                                    'Retry fetch failed:',
                                    retryError
                                );
                            }
                        }, 1000);
                    }
                }, 1000);
            } else {
                // DON'T add error message to UI - just log it
                console.error(
                    'Chat API error:',
                    response.error || 'Không thể kết nối đến server'
                );

                // const errorMessage: ChatMessage = {
                //     id: Math.random().toString(36).substr(2, 9),
                //     role: 'assistant',
                //     content: `Xin lỗi, đã có lỗi xảy ra: ${
                //         response.error || 'Không thể kết nối đến server'
                //     }`,
                //     timestamp: new Date().toISOString(),
                // };

                // if (isSessionChat && selectedSession) {
                //     setSelectedSession((prev) =>
                //         prev
                //             ? {
                //                   ...prev,
                //                   messages: [...prev.messages, errorMessage],
                //                   updatedAt: new Date().toISOString(),
                //               }
                //             : null
                //     );
                // } else {
                //     setMessages((prev) => [...prev, errorMessage]);
                // }
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // DON'T add error message to UI - just log it
            // const errorMessage: ChatMessage = {
            //     id: Math.random().toString(36).substr(2, 9),
            //     role: 'assistant',
            //     content:
            //         'Xin lỗi, đã có lỗi kết nối xảy ra. Vui lòng thử lại sau.',
            //     timestamp: new Date().toISOString(),
            // };

            // if (isSessionChat && selectedSession) {
            //     setSelectedSession((prev) =>
            //         prev
            //             ? {
            //                   ...prev,
            //                   messages: [...prev.messages, errorMessage],
            //                   updatedAt: new Date().toISOString(),
            //               }
            //             : null
            //     );
            // } else {
            //     setMessages((prev) => [...prev, errorMessage]);
            // }
        } finally {
            setIsLoading(false);
        }

        // Reset form
        setFiles(undefined);
        setAudioBlob(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: ChatSession['status']) => {
        switch (status) {
            case 'resolved':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã giải quyết
                    </Badge>
                );
            case 'active':
                return (
                    <Badge className="bg-blue-100 text-blue-800">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Đang hoạt động
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ xử lý
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const deleteSession = (sessionId: string) => {
        handleDeleteChatSession(sessionId);
    };

    // Fetch chat history from API
    const fetchChatHistory = async (isQuietRefresh = false) => {
        try {
            if (!isQuietRefresh) {
                setLoading(true);
            } else {
                setIsRefreshing(true);
            }
            setError(null);
            const response = await chatApi.getChatHistory();

            if (response.success) {
                // Ensure response.data is an array before setting it
                if (Array.isArray(response.data)) {
                    setChatHistory(response.data);

                    // Update selectedSession if it exists and we have updated data
                    if (selectedSession) {
                        const updatedSession = response.data.find(
                            (session) => session.id === selectedSession.id
                        );
                        if (updatedSession) {
                            setSelectedSession(updatedSession);
                        }
                    }

                    // Clear any existing error message on successful load
                    setError(null);
                } else {
                    console.error(
                        'API returned non-array data:',
                        response.data
                    );
                    setError(
                        'Lỗi: Dữ liệu trả về không đúng định dạng. Sử dụng dữ liệu mẫu.'
                    );
                    setChatHistory(mockChatSessions);
                }
            } else {
                // Fallback to mock data if API fails
                console.warn('API failed, using mock data:', response.error);
                setChatHistory(mockChatSessions);
                setError(
                    `Không thể tải lịch sử chat từ server: ${
                        response.error || 'Lỗi không xác định'
                    }. Sử dụng dữ liệu mẫu.`
                );
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
            setError(
                `Lỗi kết nối khi tải lịch sử chat: ${
                    error instanceof Error
                        ? error.message
                        : 'Lỗi không xác định'
                }. Sử dụng dữ liệu mẫu.`
            );
            // Fallback to mock data
            setChatHistory(mockChatSessions);
        } finally {
            if (!isQuietRefresh) {
                setLoading(false);
            } else {
                setIsRefreshing(false);
            }
        }
    };

    // Load chat history on component mount
    useEffect(() => {
        fetchChatHistory(false);
    }, []);

    // Debug effect to track chatHistory changes
    useEffect(() => {
        // Optional: Add any side effects when chat history changes
    }, [chatHistory]);

    // Handle deleting a chat session
    const handleDeleteChatSession = async (sessionId: string) => {
        try {
            setLoading(true);
            const response = await chatApi.deleteChatSession(sessionId);
            if (response.success) {
                await fetchChatHistory(false); // Refresh the list
                // Clear selected session if it was the deleted one
                if (selectedSession?.id === sessionId) {
                    setSelectedSession(null);
                    setActiveTab('new-chat');
                }
            } else {
                setError('Không thể xóa phiên chat');
            }
        } catch (error) {
            console.error('Error deleting chat session:', error);
            setError('Lỗi khi xóa phiên chat');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Vexere Chat
                            </h1>
                        </div>
                        <Link href="/">
                            <Button variant="outline">
                                <Home className="w-4 h-4 mr-2" />
                                Về trang chủ
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Error Alert */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex">
                            <div className="text-red-800 text-sm">{error}</div>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-500 hover:text-red-700"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center text-blue-800 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                            Đang tải lịch sử chat...
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
                    {/* Chat History Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-lg">
                                    <div className="flex items-center">
                                        <History className="w-5 h-5 mr-2" />
                                        Lịch sử chat
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchChatHistory(false)}
                                        disabled={loading}
                                    >
                                        <div
                                            className={`w-4 h-4 ${
                                                loading ? 'animate-spin' : ''
                                            }`}
                                        >
                                            🔄
                                        </div>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchChatHistory(false)}
                                        disabled={loading}
                                        className="ml-1"
                                    >
                                        <div className="w-4 h-4">🔧</div>
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[calc(100vh-300px)]">
                                    <div className="space-y-2 p-4">
                                        <Button
                                            variant={
                                                activeTab === 'new-chat'
                                                    ? 'default'
                                                    : 'ghost'
                                            }
                                            className="w-full justify-start"
                                            onClick={() => {
                                                setActiveTab('new-chat');
                                                setSelectedSession(null);
                                                setMessages([]);
                                                setCurrentChatId('');
                                                // Clear any form state
                                                setFiles(undefined);
                                                setAudioBlob(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value =
                                                        '';
                                                }
                                            }}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Chat mới
                                        </Button>

                                        {chatHistory.map((session) => (
                                            <div
                                                key={session.id}
                                                className="group relative"
                                            >
                                                <Button
                                                    variant={
                                                        selectedSession?.id ===
                                                        session.id
                                                            ? 'default'
                                                            : 'ghost'
                                                    }
                                                    className="w-full justify-start text-left h-auto p-3"
                                                    onClick={() => {
                                                        setSelectedSession(
                                                            session
                                                        );
                                                        setActiveTab('history');
                                                        // Clear new chat state
                                                        setMessages([]);
                                                        setCurrentChatId(
                                                            session.id
                                                        );
                                                    }}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm truncate">
                                                            {session.title}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {formatTime(
                                                                session.updatedAt
                                                            )}
                                                        </div>
                                                        <div className="mt-2">
                                                            {getStatusBadge(
                                                                session.status
                                                            )}
                                                        </div>
                                                    </div>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteSession(
                                                            session.id
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-3">
                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Bot className="w-5 h-5 mr-2 text-orange-500" />
                                        {selectedSession
                                            ? selectedSession.title
                                            : 'Trợ lý Vexere'}
                                    </div>
                                    {selectedSession && (
                                        <div className="flex items-center space-x-2">
                                            {getStatusBadge(
                                                selectedSession.status
                                            )}
                                            <span className="text-sm text-gray-500">
                                                {
                                                    selectedSession.messages
                                                        .length
                                                }{' '}
                                                tin nhắn
                                            </span>
                                        </div>
                                    )}
                                </CardTitle>
                                {!selectedSession && (
                                    <p className="text-sm text-gray-600">
                                        Hỗ trợ đặt vé, tìm kiếm chuyến xe và
                                        giải đáp thắc mắc
                                        {messages.length > 0 && (
                                            <span className="block text-xs text-blue-600 mt-1 font-medium">
                                                💬 Cuộc trò chuyện mới - Tin
                                                nhắn đầu tiên sẽ tạo phiên chat
                                                tự động
                                            </span>
                                        )}
                                    </p>
                                )}
                                {selectedSession && (
                                    <p className="text-sm text-gray-600">
                                        {selectedSession.status === 'active'
                                            ? '📝 Phiên chat đang hoạt động - Tiếp tục cuộc trò chuyện'
                                            : `📋 Phiên chat đã ${
                                                  selectedSession.status ===
                                                  'resolved'
                                                      ? 'được giải quyết'
                                                      : 'tạm dừng'
                                              }`}
                                    </p>
                                )}
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                {/* Messages Area */}
                                <ScrollArea className="flex-1 p-4 bg-gray-50 rounded-lg mb-4">
                                    <div className="space-y-4">
                                        {/* Show history messages if viewing a session */}
                                        {selectedSession ? (
                                            <>
                                                {selectedSession.messages.map(
                                                    (message) => (
                                                        <div
                                                            key={message.id}
                                                            className={`flex ${
                                                                message.role ===
                                                                'user'
                                                                    ? 'justify-end'
                                                                    : 'justify-start'
                                                            }`}
                                                        >
                                                            <div
                                                                className={`max-w-[80%] rounded-lg p-3 ${
                                                                    message.role ===
                                                                    'user'
                                                                        ? 'bg-orange-500 text-white'
                                                                        : 'bg-white text-gray-900 shadow-sm'
                                                                }`}
                                                            >
                                                                <div className="flex items-center mb-1">
                                                                    {message.role ===
                                                                    'user' ? (
                                                                        <User className="w-4 h-4 mr-2" />
                                                                    ) : (
                                                                        <Bot className="w-4 h-4 mr-2 text-orange-500" />
                                                                    )}
                                                                    <span className="text-xs opacity-75">
                                                                        {message.role ===
                                                                        'user'
                                                                            ? 'Bạn'
                                                                            : 'Trợ lý'}
                                                                    </span>
                                                                    <span className="text-xs opacity-50 ml-2">
                                                                        {formatTime(
                                                                            message.timestamp
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <div className="whitespace-pre-wrap">
                                                                    {
                                                                        message.content
                                                                    }
                                                                </div>

                                                                {/* Display attachments */}
                                                                {message.attachments?.map(
                                                                    (
                                                                        attachment,
                                                                        index
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="mt-2"
                                                                        >
                                                                            {attachment.type ===
                                                                                'image' && (
                                                                                <Image
                                                                                    src={
                                                                                        attachment.url ||
                                                                                        '/placeholder.svg'
                                                                                    }
                                                                                    alt={
                                                                                        attachment.name
                                                                                    }
                                                                                    width={
                                                                                        200
                                                                                    }
                                                                                    height={
                                                                                        200
                                                                                    }
                                                                                    className="rounded-lg"
                                                                                />
                                                                            )}
                                                                            {attachment.type ===
                                                                                'audio' && (
                                                                                <audio
                                                                                    controls
                                                                                    src={
                                                                                        attachment.url
                                                                                    }
                                                                                    className="mt-2"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}

                                                {/* Loading state for session chat */}
                                                {isLoading && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-white text-gray-900 shadow-sm rounded-lg p-3">
                                                            <div className="flex items-center">
                                                                <Bot className="w-4 h-4 mr-2 text-orange-500" />
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-sm">
                                                                        Đang trả
                                                                        lời
                                                                    </span>
                                                                    <div className="flex space-x-1">
                                                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                                                                        <div
                                                                            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                                                                            style={{
                                                                                animationDelay:
                                                                                    '0.1s',
                                                                            }}
                                                                        ></div>
                                                                        <div
                                                                            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                                                                            style={{
                                                                                animationDelay:
                                                                                    '0.2s',
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {/* New chat welcome message */}
                                                {messages.length === 0 && (
                                                    <div className="text-center py-8">
                                                        <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                                        <p className="text-gray-500 mb-4">
                                                            Xin chào! Tôi là trợ
                                                            lý Vexere. Tôi có
                                                            thể giúp bạn:
                                                        </p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 max-w-2xl mx-auto">
                                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                                <h4 className="font-medium mb-2">
                                                                    🎫 Đặt vé xe
                                                                </h4>
                                                                <p>
                                                                    Tìm kiếm và
                                                                    đặt vé xe
                                                                    khách toàn
                                                                    quốc
                                                                </p>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                                <h4 className="font-medium mb-2">
                                                                    📞 Hỗ trợ
                                                                    24/7
                                                                </h4>
                                                                <p>
                                                                    Giải đáp
                                                                    thắc mắc về
                                                                    dịch vụ
                                                                </p>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                                <h4 className="font-medium mb-2">
                                                                    🔄 Đổi/Hủy
                                                                    vé
                                                                </h4>
                                                                <p>
                                                                    Hướng dẫn
                                                                    thay đổi
                                                                    thông tin vé
                                                                </p>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                                <h4 className="font-medium mb-2">
                                                                    💬 Đa phương
                                                                    tiện
                                                                </h4>
                                                                <p>
                                                                    Hỗ trợ văn
                                                                    bản, giọng
                                                                    nói và hình
                                                                    ảnh
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Current chat messages */}
                                                {messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${
                                                            message.role ===
                                                            'user'
                                                                ? 'justify-end'
                                                                : 'justify-start'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`max-w-[80%] rounded-lg p-3 ${
                                                                message.role ===
                                                                'user'
                                                                    ? 'bg-orange-500 text-white'
                                                                    : 'bg-white text-gray-900 shadow-sm'
                                                            }`}
                                                        >
                                                            <div className="flex items-center mb-1">
                                                                {message.role ===
                                                                'user' ? (
                                                                    <User className="w-4 h-4 mr-2" />
                                                                ) : (
                                                                    <Bot className="w-4 h-4 mr-2 text-orange-500" />
                                                                )}
                                                                <span className="text-xs opacity-75">
                                                                    {message.role ===
                                                                    'user'
                                                                        ? 'Bạn'
                                                                        : 'Trợ lý'}
                                                                </span>
                                                            </div>

                                                            <div className="whitespace-pre-wrap">
                                                                {
                                                                    message.content
                                                                }
                                                            </div>

                                                            {/* Display attachments */}
                                                            {message.attachments?.map(
                                                                (
                                                                    attachment,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="mt-2"
                                                                    >
                                                                        {attachment.type ===
                                                                            'image' && (
                                                                            <Image
                                                                                src={
                                                                                    attachment.url ||
                                                                                    '/placeholder.svg'
                                                                                }
                                                                                alt={
                                                                                    attachment.name ||
                                                                                    `attachment-${index}`
                                                                                }
                                                                                width={
                                                                                    200
                                                                                }
                                                                                height={
                                                                                    200
                                                                                }
                                                                                className="rounded-lg"
                                                                            />
                                                                        )}
                                                                        {attachment.type ===
                                                                            'audio' && (
                                                                            <audio
                                                                                controls
                                                                                src={
                                                                                    attachment.url
                                                                                }
                                                                                className="mt-2"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {isLoading && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-white text-gray-900 shadow-sm rounded-lg p-3">
                                                            <div className="flex items-center">
                                                                <Bot className="w-4 h-4 mr-2 text-orange-500" />
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-sm">
                                                                        Đang trả
                                                                        lời
                                                                    </span>
                                                                    <div className="flex space-x-1">
                                                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                                                                        <div
                                                                            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                                                                            style={{
                                                                                animationDelay:
                                                                                    '0.1s',
                                                                            }}
                                                                        ></div>
                                                                        <div
                                                                            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                                                                            style={{
                                                                                animationDelay:
                                                                                    '0.2s',
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Input Area - Show for new chat and active sessions */}
                                {(!selectedSession ||
                                    selectedSession.status === 'active') && (
                                    <form
                                        onSubmit={handleFormSubmit}
                                        className="space-y-3"
                                    >
                                        {/* File Preview */}
                                        {files && files.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(files).map(
                                                    (file, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="secondary"
                                                        >
                                                            <ImageIcon className="w-3 h-3 mr-1" />
                                                            {file.name}
                                                        </Badge>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Audio Preview */}
                                        {audioBlob && (
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="secondary">
                                                    <Mic className="w-3 h-3 mr-1" />
                                                    Ghi âm sẵn sàng
                                                </Badge>
                                                <audio
                                                    controls
                                                    src={URL.createObjectURL(
                                                        audioBlob
                                                    )}
                                                    className="h-8"
                                                />
                                            </div>
                                        )}

                                        <div className="flex space-x-2">
                                            {/* File Upload */}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={(e) =>
                                                    setFiles(
                                                        e.target.files ||
                                                            undefined
                                                    )
                                                }
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                            </Button>

                                            {/* Voice Recording */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={
                                                    isRecording
                                                        ? stopRecording
                                                        : startRecording
                                                }
                                                className={
                                                    isRecording
                                                        ? 'bg-red-100 text-red-600'
                                                        : ''
                                                }
                                            >
                                                {isRecording ? (
                                                    <MicOff className="w-4 h-4" />
                                                ) : (
                                                    <Mic className="w-4 h-4" />
                                                )}
                                            </Button>

                                            {/* Text Input */}
                                            <Input
                                                value={input}
                                                onChange={handleInputChange}
                                                placeholder={
                                                    selectedSession
                                                        ? 'Tiếp tục cuộc trò chuyện...'
                                                        : 'Nhập tin nhắn hoặc hỏi về vé xe...'
                                                }
                                                className="flex-1"
                                            />

                                            {/* Send Button */}
                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                            >
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {/* Disabled session message */}
                                {selectedSession &&
                                    selectedSession.status !== 'active' && (
                                        <div className="bg-gray-100 p-3 rounded-lg text-center text-sm text-gray-600">
                                            📝 Phiên chat này đã{' '}
                                            {selectedSession.status ===
                                            'resolved'
                                                ? 'được giải quyết'
                                                : 'tạm dừng'}
                                            . Không thể gửi tin nhắn mới.
                                            <br />
                                            <span className="text-xs text-gray-500 mt-1 block">
                                                Để bắt đầu cuộc trò chuyện mới,
                                                vui lòng chọn "Chat mới".
                                            </span>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
