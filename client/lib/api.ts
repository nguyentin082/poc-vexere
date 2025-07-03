import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor (no auth needed)
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export interface TicketData {
    _id?: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    type: string;
    from: string;
    to: string;
    date: string;
    time: string;
    seatNumber: string;
    price: number;
    payment: {
        done: boolean;
        gate: string;
        transactionId: string;
    };
    status: 'confirmed' | 'pending' | 'cancelled';
    tripId: string;
    companyName: string;
    note: string;
    logs: Array<{
        action: string;
        timestamp: string;
        by: string;
        field?: string;
        oldValue?: string;
        newValue?: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    message?: string;
}

// Ticket API endpoints
export const ticketApi = {
    // Get all tickets
    getTickets: async (): Promise<PaginatedResponse<TicketData>> => {
        const response = await api.get('/ticket');
        return response.data;
    },

    // Get single ticket by ID
    getTicket: async (id: string): Promise<ApiResponse<TicketData>> => {
        const response = await api.get(`/ticket/${id}`);
        return response.data;
    },

    // Create new ticket
    createTicket: async (
        ticketData: Omit<TicketData, '_id' | 'createdAt' | 'updatedAt' | 'logs'>
    ): Promise<ApiResponse<TicketData>> => {
        const response = await api.post('/ticket', ticketData);
        return response.data;
    },

    // Update existing ticket
    updateTicket: async (
        id: string,
        ticketData: Partial<TicketData>
    ): Promise<ApiResponse<TicketData>> => {
        const response = await api.put(`/ticket/${id}`, ticketData);
        return response.data;
    },

    // Delete ticket
    deleteTicket: async (id: string): Promise<ApiResponse<null>> => {
        const response = await api.delete(`/ticket/${id}`);
        return response.data;
    },

    // Get ticket statistics
    getStats: async (): Promise<
        ApiResponse<{
            total: number;
            confirmed: number;
            pending: number;
            cancelled: number;
            paid: number;
            unpaid: number;
        }>
    > => {
        const response = await api.get('/ticket/stats');
        return response.data;
    },
};

export default api;
