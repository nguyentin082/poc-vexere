'use client';

import type React from 'react';

import { useChat } from 'ai/react';
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
    const { messages, input, handleInputChange, handleSubmit, isLoading } =
        useChat();
    const [files, setFiles] = useState<FileList | undefined>(undefined);
    const [isRecording, setIsRecording] = useState(false);
    const [activeTab, setActiveTab] = useState('new-chat');
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
        null
    );
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

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

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        handleSubmit(e, {
            experimental_attachments: files,
        });

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
    const fetchChatHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await chatApi.getChatHistory();

            console.log('API Response:', response); // Debug log

            if (response.success) {
                // Ensure response.data is an array before setting it
                if (Array.isArray(response.data)) {
                    setChatHistory(response.data);
                    console.log(
                        'Chat history loaded successfully:',
                        response.data.length,
                        'sessions'
                    );
                    // Clear any existing error message on successful load
                    setError(null);

                    // Optional: Show info message if no chat history exists
                    if (response.data.length === 0) {
                        console.log('No chat history found, starting fresh');
                    }
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
            setLoading(false);
        }
    };

    // Load chat history on component mount
    useEffect(() => {
        fetchChatHistory();
    }, []);

    // Handle creating a new chat session
    const handleCreateChatSession = async (
        title: string,
        messages: ChatMessage[]
    ) => {
        try {
            setLoading(true);
            const newSession = {
                title,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active' as const,
                messages: messages.map((msg) => ({
                    ...msg,
                    timestamp:
                        typeof msg.timestamp === 'string'
                            ? msg.timestamp
                            : new Date().toISOString(),
                })),
            };

            const response = await chatApi.createChatSession(newSession);
            if (response.success) {
                await fetchChatHistory(); // Refresh the list
            } else {
                setError('Không thể tạo phiên chat mới');
            }
        } catch (error) {
            console.error('Error creating chat session:', error);
            setError('Lỗi khi tạo phiên chat mới');
        } finally {
            setLoading(false);
        }
    };

    // Handle updating a chat session
    const handleUpdateChatSession = async (
        sessionId: string,
        updates: Partial<ChatSession>
    ) => {
        try {
            setLoading(true);
            const response = await chatApi.updateChatSession(sessionId, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });
            if (response.success) {
                await fetchChatHistory(); // Refresh the list
            } else {
                setError('Không thể cập nhật phiên chat');
            }
        } catch (error) {
            console.error('Error updating chat session:', error);
            setError('Lỗi khi cập nhật phiên chat');
        } finally {
            setLoading(false);
        }
    };

    // Handle deleting a chat session
    const handleDeleteChatSession = async (sessionId: string) => {
        try {
            setLoading(true);
            const response = await chatApi.deleteChatSession(sessionId);
            if (response.success) {
                await fetchChatHistory(); // Refresh the list
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
                                        onClick={fetchChatHistory}
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
                                    </p>
                                )}
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                {/* Messages Area */}
                                <ScrollArea className="flex-1 p-4 bg-gray-50 rounded-lg mb-4">
                                    <div className="space-y-4">
                                        {/* Show history messages if viewing a session */}
                                        {selectedSession ? (
                                            selectedSession.messages.map(
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
                                            )
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
                                                            {message.experimental_attachments?.map(
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
                                                                        {attachment.contentType?.startsWith(
                                                                            'image/'
                                                                        ) && (
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
                                                                <span className="text-sm">
                                                                    Đang trả
                                                                    lời...
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Input Area - Only show for new chat */}
                                {!selectedSession && (
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
                                                placeholder="Nhập tin nhắn hoặc hỏi về vé xe..."
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

                                {/* Read-only message for history */}
                                {selectedSession && (
                                    <div className="bg-gray-100 p-3 rounded-lg text-center text-sm text-gray-600">
                                        Đây là cuộc hội thoại đã kết thúc. Để
                                        chat mới, vui lòng chọn "Chat mới".
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
