'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ticketApi, type TicketData } from '@/lib/api';
import {
    useIsClient,
    formatDateSafe,
    formatDateClient,
} from '@/lib/client-utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    MessageCircle,
    Search,
    MapPin,
    DollarSign,
    Plus,
    Edit,
    Trash2,
    User,
    Phone,
    Mail,
    Calendar,
    Bus,
    Filter,
    X,
    Copy,
} from 'lucide-react';
import Link from 'next/link';
import { mockTickets } from '@/mock';

export default function HomePage() {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [paymentFilter, setPaymentFilter] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
    const [formData, setFormData] = useState<Partial<TicketData>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isClient = useIsClient();

    // Utility function to get ticket ID
    const getTicketId = (ticket: TicketData): string | undefined => {
        return ticket._id || ticket.id;
    };

    // Fetch tickets from API
    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await ticketApi.getTickets();

            if (response.success) {
                setTickets(response.data);
                setFilteredTickets(response.data);
            } else {
                // Fallback to mock data if API fails
                console.warn('API failed, using mock data:', response.message);
                setTickets(mockTickets);
                setFilteredTickets(mockTickets);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            setError('Không thể tải dữ liệu vé. Sử dụng dữ liệu mẫu.');
            // Fallback to mock data
            setTickets(mockTickets);
            setFilteredTickets(mockTickets);
        } finally {
            setLoading(false);
        }
    };

    // Load tickets on component mount
    useEffect(() => {
        fetchTickets();
    }, []);

    // Filter tickets locally (can be optimized to use API filtering)
    useEffect(() => {
        const filtered = tickets.filter((ticket) => {
            const ticketId = getTicketId(ticket);
            const matchesSearch =
                ticket.userName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                ticket.userPhone.includes(searchTerm) ||
                ticket.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.tripId
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                ticket.companyName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (ticketId &&
                    ticketId.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus =
                statusFilter === 'all' || ticket.status === statusFilter;
            const matchesPayment =
                paymentFilter === 'all' ||
                (paymentFilter === 'paid' && ticket.payment.done) ||
                (paymentFilter === 'unpaid' && !ticket.payment.done);

            return matchesSearch && matchesStatus && matchesPayment;
        });
        setFilteredTickets(filtered);
    }, [tickets, searchTerm, statusFilter, paymentFilter]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const formatDateTime = (dateStr: string, timeStr: string) => {
        // Use client-safe formatting to avoid hydration issues
        return isClient
            ? formatDateClient(dateStr, timeStr)
            : formatDateSafe(dateStr, timeStr);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        Đã xác nhận
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        Chờ xử lý
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-red-100 text-red-800">Đã hủy</Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getPaymentBadge = (payment: TicketData['payment']) => {
        return payment.done ? (
            <Badge className="bg-blue-100 text-blue-800">Đã thanh toán</Badge>
        ) : (
            <Badge className="bg-orange-100 text-orange-800">
                Chưa thanh toán
            </Badge>
        );
    };

    const resetForm = () => {
        setFormData({
            userName: '',
            userPhone: '',
            userEmail: '',
            type: 'bus',
            from: '',
            to: '',
            date: '',
            time: '',
            seatNumber: '',
            price: 0,
            payment: {
                done: false,
                gate: 'momo',
                transactionId: '',
            },
            status: 'pending',
            tripId: '',
            companyName: '',
            note: '',
        });
    };

    const handleCreate = async () => {
        if (!formData.userName || !formData.from || !formData.to) return;

        try {
            setLoading(true);
            const ticketData = {
                ...(formData as Omit<
                    TicketData,
                    '_id' | 'createdAt' | 'updatedAt' | 'logs'
                >),
                logs: [
                    {
                        action: 'create',
                        timestamp: new Date().toISOString(),
                        by: 'admin',
                    },
                ],
            };

            const response = await ticketApi.createTicket(ticketData);

            if (response.success) {
                await fetchTickets(); // Refresh the list
                setIsCreateDialogOpen(false);
                resetForm();
            } else {
                setError('Không thể tạo vé mới');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            setError('Lỗi khi tạo vé mới');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (ticket: TicketData) => {
        console.log('Editing ticket:', ticket);
        console.log('Ticket ID:', getTicketId(ticket));
        setEditingTicket(ticket);
        setFormData(ticket);
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        console.log('Updating ticket:', editingTicket);
        console.log('Form data:', formData);

        if (!editingTicket || !formData.userName) {
            console.error('Missing editing ticket or userName');
            return;
        }

        const ticketId = getTicketId(editingTicket);
        if (!ticketId) {
            console.error('Missing ticket ID for update');
            setError('Không thể cập nhật: thiếu ID vé');
            return;
        }

        try {
            setLoading(true);
            const response = await ticketApi.updateTicket(ticketId, formData);

            if (response.success) {
                await fetchTickets(); // Refresh the list
                setIsEditDialogOpen(false);
                setEditingTicket(null);
                resetForm();
            } else {
                setError('Không thể cập nhật vé');
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            setError('Lỗi khi cập nhật vé');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (ticketId: string) => {
        try {
            setLoading(true);
            const response = await ticketApi.deleteTicket(ticketId);

            if (response.success) {
                await fetchTickets(); // Refresh the list
            } else {
                setError('Không thể xóa vé');
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            setError('Lỗi khi xóa vé');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPaymentFilter('all');
        // No need to refetch since we show all tickets
    };

    // Only fetch once on mount
    useEffect(() => {
        fetchTickets();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    V
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Vexere Admin
                            </h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link href="/chat">
                                <Button variant="outline" size="sm">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Chat
                                </Button>
                            </Link>
                            <Dialog
                                open={isCreateDialogOpen}
                                onOpenChange={setIsCreateDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        className="bg-orange-500 hover:bg-orange-600"
                                        onClick={resetForm}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">
                                            Thêm vé mới
                                        </span>
                                        <span className="sm:hidden">Thêm</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Thêm vé xe mới
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="userName">
                                                    Tên khách hàng *
                                                </Label>
                                                <Input
                                                    id="userName"
                                                    value={
                                                        formData.userName || ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            userName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Nhập tên khách hàng"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="userPhone">
                                                    Số điện thoại
                                                </Label>
                                                <Input
                                                    id="userPhone"
                                                    value={
                                                        formData.userPhone || ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            userPhone:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Nhập số điện thoại"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="userEmail">
                                                Email
                                            </Label>
                                            <Input
                                                id="userEmail"
                                                type="email"
                                                value={formData.userEmail || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        userEmail:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="Nhập email"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="from">
                                                    Điểm đi *
                                                </Label>
                                                <Input
                                                    id="from"
                                                    value={formData.from || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            from: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Nhập điểm đi"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="to">
                                                    Điểm đến *
                                                </Label>
                                                <Input
                                                    id="to"
                                                    value={formData.to || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            to: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Nhập điểm đến"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="date">
                                                    Ngày khởi hành
                                                </Label>
                                                <Input
                                                    id="date"
                                                    type="date"
                                                    value={formData.date || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            date: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                            </div>{' '}
                                            <div>
                                                <Label htmlFor="time">
                                                    Giờ khởi hành
                                                </Label>
                                                <Input
                                                    id="time"
                                                    type="time"
                                                    value={formData.time || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            time: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="seatNumber">
                                                    Số ghế
                                                </Label>
                                                <Input
                                                    id="seatNumber"
                                                    value={
                                                        formData.seatNumber ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            seatNumber:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="VD: A12"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="price">
                                                    Giá vé (VND)
                                                </Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    value={formData.price || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            price: Number(
                                                                e.target.value
                                                            ),
                                                        })
                                                    }
                                                    placeholder="250000"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="status">
                                                    Trạng thái
                                                </Label>
                                                <Select
                                                    value={
                                                        formData.status ||
                                                        'pending'
                                                    }
                                                    onValueChange={(value) =>
                                                        setFormData({
                                                            ...formData,
                                                            status: value as any,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">
                                                            Chờ xử lý
                                                        </SelectItem>
                                                        <SelectItem value="confirmed">
                                                            Đã xác nhận
                                                        </SelectItem>
                                                        <SelectItem value="cancelled">
                                                            Đã hủy
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="tripId">
                                                    Mã chuyến
                                                </Label>
                                                <Input
                                                    id="tripId"
                                                    value={
                                                        formData.tripId || ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            tripId: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="TRIP_0001"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="companyName">
                                                    Nhà xe
                                                </Label>
                                                <Input
                                                    id="companyName"
                                                    value={
                                                        formData.companyName ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            companyName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Nhà xe ABC"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="note">
                                                Ghi chú
                                            </Label>
                                            <Textarea
                                                id="note"
                                                value={formData.note || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        note: e.target.value,
                                                    })
                                                }
                                                placeholder="Ghi chú thêm..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setIsCreateDialogOpen(false)
                                            }
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            onClick={handleCreate}
                                            disabled={loading}
                                            className="bg-orange-500 hover:bg-orange-600"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Đang tạo...
                                                </>
                                            ) : (
                                                'Tạo vé'
                                            )}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
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
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center text-blue-800 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                            Đang tải dữ liệu...
                        </div>
                    </div>
                )}

                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <Filter className="w-5 h-5 mr-2" />
                                Bộ lọc và tìm kiếm
                            </span>
                            {(searchTerm ||
                                statusFilter !== 'all' ||
                                paymentFilter !== 'all') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Xóa bộ lọc
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <Input
                                    placeholder="Tìm theo tên, SĐT, tuyến đường, mã chuyến, mã vé..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full"
                                />
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tất cả trạng thái
                                    </SelectItem>
                                    <SelectItem value="confirmed">
                                        Đã xác nhận
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Chờ xử lý
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        Đã hủy
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={paymentFilter}
                                onValueChange={setPaymentFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Thanh toán" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="paid">
                                        Đã thanh toán
                                    </SelectItem>
                                    <SelectItem value="unpaid">
                                        Chưa thanh toán
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-600">
                                {tickets.length}
                            </div>
                            <p className="text-sm text-gray-600">Tổng vé</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">
                                {
                                    tickets.filter(
                                        (t) => t.status === 'confirmed'
                                    ).length
                                }
                            </div>
                            <p className="text-sm text-gray-600">Đã xác nhận</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-yellow-600">
                                {
                                    tickets.filter(
                                        (t) => t.status === 'pending'
                                    ).length
                                }
                            </div>
                            <p className="text-sm text-gray-600">Chờ xử lý</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">
                                {tickets.filter((t) => t.payment.done).length}
                            </div>
                            <p className="text-sm text-gray-600">
                                Đã thanh toán
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tickets List */}
                <div className="space-y-4">
                    {filteredTickets.map((ticket, index) => (
                        <Card
                            key={getTicketId(ticket) || `ticket-${index}`}
                            className="hover:shadow-lg transition-shadow"
                        >
                            <CardContent className="p-6">
                                {/* Ticket ID Header */}
                                <div className="mb-4 pb-3 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Badge
                                                variant="outline"
                                                className="text-blue-600 border-blue-200 font-mono"
                                            >
                                                Mã vé:{' '}
                                                {getTicketId(ticket) ||
                                                    'Chưa có ID'}
                                            </Badge>
                                            {getTicketId(ticket) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            getTicketId(
                                                                ticket
                                                            ) || ''
                                                        );
                                                        // You can add a toast notification here
                                                    }}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Tạo:{' '}
                                            {isClient && ticket.createdAt
                                                ? new Date(
                                                      ticket.createdAt
                                                  ).toLocaleDateString(
                                                      'vi-VN',
                                                      {
                                                          day: '2-digit',
                                                          month: '2-digit',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      }
                                                  )
                                                : 'Không rõ'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    {/* Customer Info */}
                                    <div className="lg:col-span-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 mr-2 text-gray-500" />
                                                <span className="font-medium">
                                                    {ticket.userName}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Phone className="w-3 h-3 mr-2" />
                                                {ticket.userPhone}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Mail className="w-3 h-3 mr-2" />
                                                {ticket.userEmail}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trip Info */}
                                    <div className="lg:col-span-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                                                <span className="font-medium">
                                                    {ticket.from} → {ticket.to}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="w-3 h-3 mr-2" />
                                                {formatDateTime(
                                                    ticket.date,
                                                    ticket.time
                                                )}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Bus className="w-3 h-3 mr-2" />
                                                {ticket.companyName} - Ghế{' '}
                                                {ticket.seatNumber}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Mã chuyến: {ticket.tripId}
                                            </div>
                                            <div className="text-xs text-blue-600 font-medium">
                                                Mã vé:{' '}
                                                {getTicketId(ticket) ||
                                                    'Chưa có ID'}
                                            </div>
                                            {!getTicketId(ticket) && (
                                                <div className="text-xs text-red-500">
                                                    ⚠️ Thiếu ID vé
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status & Payment */}
                                    <div className="lg:col-span-3">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {getStatusBadge(ticket.status)}
                                                {getPaymentBadge(
                                                    ticket.payment
                                                )}
                                            </div>
                                            <div className="flex items-center text-lg font-bold text-orange-600">
                                                <DollarSign className="w-4 h-4" />
                                                {formatPrice(ticket.price)}
                                            </div>
                                            {ticket.payment.done && (
                                                <div className="text-xs text-gray-500">
                                                    {ticket.payment.gate.toUpperCase()}
                                                    :{' '}
                                                    {
                                                        ticket.payment
                                                            .transactionId
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="lg:col-span-2">
                                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleEdit(ticket)
                                                }
                                                className="flex-1"
                                                disabled={!getTicketId(ticket)}
                                            >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Sửa
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-red-600 hover:text-red-700 bg-transparent"
                                                        disabled={
                                                            !getTicketId(ticket)
                                                        }
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                        Xóa
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Xác nhận xóa vé
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bạn có chắc chắn
                                                            muốn xóa vé của{' '}
                                                            {ticket.userName}?
                                                            Hành động này không
                                                            thể hoàn tác.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Hủy
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => {
                                                                const ticketId =
                                                                    getTicketId(
                                                                        ticket
                                                                    );
                                                                if (ticketId) {
                                                                    handleDelete(
                                                                        ticketId
                                                                    );
                                                                }
                                                            }}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Xóa vé
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </div>

                                {/* Note */}
                                {ticket.note && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm text-gray-600">
                                            <strong>Ghi chú:</strong>{' '}
                                            {ticket.note}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredTickets.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg mb-2">
                            Không tìm thấy vé nào
                        </p>
                        <p className="text-gray-400 mb-4">
                            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            Xóa bộ lọc
                        </Button>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa vé xe</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-userName">
                                    Tên khách hàng *
                                </Label>
                                <Input
                                    id="edit-userName"
                                    value={formData.userName || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            userName: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-userPhone">
                                    Số điện thoại
                                </Label>
                                <Input
                                    id="edit-userPhone"
                                    value={formData.userPhone || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            userPhone: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="edit-userEmail">Email</Label>
                            <Input
                                id="edit-userEmail"
                                type="email"
                                value={formData.userEmail || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        userEmail: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-from">Điểm đi *</Label>
                                <Input
                                    id="edit-from"
                                    value={formData.from || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            from: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-to">Điểm đến *</Label>
                                <Input
                                    id="edit-to"
                                    value={formData.to || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            to: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-date">
                                    Ngày khởi hành
                                </Label>
                                <Input
                                    id="edit-date"
                                    type="date"
                                    value={formData.date || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            date: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-time">Giờ khởi hành</Label>
                                <Input
                                    id="edit-time"
                                    type="time"
                                    value={formData.time || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            time: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="edit-seatNumber">Số ghế</Label>
                                <Input
                                    id="edit-seatNumber"
                                    value={formData.seatNumber || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            seatNumber: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-price">Giá vé (VND)</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    value={formData.price || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            price: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-status">Trạng thái</Label>
                                <Select
                                    value={formData.status || 'pending'}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            status: value as any,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">
                                            Chờ xử lý
                                        </SelectItem>
                                        <SelectItem value="confirmed">
                                            Đã xác nhận
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            Đã hủy
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-tripId">Mã chuyến</Label>
                                <Input
                                    id="edit-tripId"
                                    value={formData.tripId || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tripId: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-companyName">Nhà xe</Label>
                                <Input
                                    id="edit-companyName"
                                    value={formData.companyName || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            companyName: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="edit-note">Ghi chú</Label>
                            <Textarea
                                id="edit-note"
                                value={formData.note || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        note: e.target.value,
                                    })
                                }
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="bg-orange-500 hover:bg-orange-600"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Đang cập nhật...
                                </>
                            ) : (
                                'Cập nhật'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
