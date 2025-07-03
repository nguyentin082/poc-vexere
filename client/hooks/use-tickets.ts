import { useState, useEffect } from 'react';
import { ticketApi, type TicketData } from '@/lib/api';

// Mock data for fallback
const mockTickets: TicketData[] = [
    {
        _id: '1',
        userName: 'Trung Tin',
        userPhone: '0901234567',
        userEmail: 'trungtin@example.com',
        type: 'bus',
        from: 'Ho Chi Minh',
        to: 'Vinh Long',
        date: '2025-06-03',
        time: '01:00 AM',
        seatNumber: 'B12',
        price: 250000,
        payment: {
            done: true,
            gate: 'momo',
            transactionId: 'MOMO_202507030900',
        },
        status: 'confirmed',
        tripId: 'TRIP_0001',
        companyName: 'Nhà xe ABC',
        note: '',
        logs: [
            {
                action: 'create',
                timestamp: '2025-07-03T09:00:00.000Z',
                by: 'system',
            },
        ],
        createdAt: '2025-07-03T09:00:00.000Z',
        updatedAt: '2025-07-03T09:10:27.455Z',
    },
    {
        _id: '2',
        userName: 'Minh Anh',
        userPhone: '0987654321',
        userEmail: 'minhanh@example.com',
        type: 'bus',
        from: 'Ha Noi',
        to: 'Da Nang',
        date: '2025-06-05',
        time: '08:30 AM',
        seatNumber: 'A15',
        price: 450000,
        payment: {
            done: false,
            gate: 'vnpay',
            transactionId: 'VNPAY_202507030901',
        },
        status: 'pending',
        tripId: 'TRIP_0002',
        companyName: 'Phương Trang',
        note: 'Yêu cầu ghế cửa sổ',
        logs: [
            {
                action: 'create',
                timestamp: '2025-07-03T10:00:00.000Z',
                by: 'user',
            },
        ],
        createdAt: '2025-07-03T10:00:00.000Z',
        updatedAt: '2025-07-03T10:00:00.000Z',
    },
    {
        _id: '3',
        userName: 'Hoàng Nam',
        userPhone: '0912345678',
        userEmail: 'hoangnam@example.com',
        type: 'bus',
        from: 'Da Nang',
        to: 'Hue',
        date: '2025-06-07',
        time: '02:15 PM',
        seatNumber: 'C08',
        price: 120000,
        payment: {
            done: true,
            gate: 'zalopay',
            transactionId: 'ZALO_202507030902',
        },
        status: 'confirmed',
        tripId: 'TRIP_0003',
        companyName: 'Mai Linh',
        note: '',
        logs: [
            {
                action: 'create',
                timestamp: '2025-07-03T11:00:00.000Z',
                by: 'system',
            },
        ],
        createdAt: '2025-07-03T11:00:00.000Z',
        updatedAt: '2025-07-03T11:00:00.000Z',
    },
];

export const useTickets = () => {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await ticketApi.getTickets();

            if (response.success) {
                setTickets(response.data);
            } else {
                console.warn('API failed, using mock data:', response.message);
                setTickets(mockTickets);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            setError('Không thể tải dữ liệu vé. Sử dụng dữ liệu mẫu.');
            setTickets(mockTickets);
        } finally {
            setLoading(false);
        }
    };

    const createTicket = async (
        ticketData: Omit<TicketData, '_id' | 'createdAt' | 'updatedAt' | 'logs'>
    ) => {
        try {
            setLoading(true);
            setError(null);

            const response = await ticketApi.createTicket(ticketData);

            if (response.success) {
                await fetchTickets();
                return true;
            } else {
                setError('Không thể tạo vé mới');
                return false;
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            setError('Lỗi khi tạo vé mới');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateTicket = async (
        id: string,
        ticketData: Partial<TicketData>
    ) => {
        try {
            setLoading(true);
            setError(null);

            const response = await ticketApi.updateTicket(id, ticketData);

            if (response.success) {
                await fetchTickets();
                return true;
            } else {
                setError('Không thể cập nhật vé');
                return false;
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            setError('Lỗi khi cập nhật vé');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteTicket = async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await ticketApi.deleteTicket(id);

            if (response.success) {
                await fetchTickets();
                return true;
            } else {
                setError('Không thể xóa vé');
                return false;
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            setError('Lỗi khi xóa vé');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => setError(null);

    return {
        tickets,
        loading,
        error,
        fetchTickets,
        createTicket,
        updateTicket,
        deleteTicket,
        clearError,
    };
};
