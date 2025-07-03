// Interface cho chat history
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

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'resolved' | 'pending';
}

// Mock data cho chat history
export const mockChatSessions: ChatSession[] = [
    {
        id: 'chat_001',
        title: 'Tìm vé Hà Nội - TP.HCM',
        createdAt: '2025-01-03T09:00:00.000Z',
        updatedAt: '2025-01-03T09:15:00.000Z',
        status: 'resolved',
        messages: [
            {
                id: 'msg_001',
                role: 'user',
                content:
                    'Chào bạn, tôi muốn tìm vé xe từ Hà Nội đi TP.HCM vào ngày 15/01/2025',
                timestamp: '2025-01-03T09:00:00.000Z',
            },
            {
                id: 'msg_002',
                role: 'assistant',
                content:
                    'Chào anh/chị! Tôi sẽ giúp anh/chị tìm vé xe từ Hà Nội đi TP.HCM ngày 15/01/2025.\n\nHiện tại có các chuyến xe sau:\n\n🚌 **Phương Trang**\n- Khởi hành: 06:00 - Đến: 18:00\n- Loại xe: Giường nằm\n- Giá: 450.000 VND\n- Còn 12 chỗ\n\n🚌 **Hoàng Long**\n- Khởi hành: 22:00 - Đến: 06:00+1\n- Loại xe: Giường nằm VIP\n- Giá: 520.000 VND\n- Còn 8 chỗ\n\nAnh/chị có muốn đặt chuyến nào không?',
                timestamp: '2025-01-03T09:01:00.000Z',
            },
            {
                id: 'msg_003',
                role: 'user',
                content:
                    'Tôi muốn đặt chuyến Phương Trang 6h sáng. Làm sao để đặt vé?',
                timestamp: '2025-01-03T09:05:00.000Z',
            },
            {
                id: 'msg_004',
                role: 'assistant',
                content:
                    'Tuyệt vời! Để đặt vé chuyến Phương Trang 06:00, anh/chị có thể:\n\n**Cách 1: Đặt trực tuyến**\n1. Truy cập website Vexere.com\n2. Chọn tuyến Hà Nội - TP.HCM, ngày 15/01\n3. Chọn chuyến Phương Trang 06:00\n4. Điền thông tin và thanh toán\n\n**Cách 2: Gọi hotline**\n📞 1900 888 684 (24/7)\n\n**Thông tin cần chuẩn bị:**\n- Họ tên đầy đủ\n- Số điện thoại\n- Email (nếu có)\n\nAnh/chị có cần hỗ trợ thêm gì không?',
                timestamp: '2025-01-03T09:07:00.000Z',
            },
            {
                id: 'msg_005',
                role: 'user',
                content: 'Cảm ơn bạn! Thông tin rất hữu ích.',
                timestamp: '2025-01-03T09:15:00.000Z',
            },
            {
                id: 'msg_006',
                role: 'assistant',
                content:
                    'Rất vui được hỗ trợ anh/chị! 😊\n\nChúc anh/chị có chuyến đi an toàn và thuận lợi. Nếu có thắc mắc gì thêm, đừng ngần ngại liên hệ với Vexere nhé!\n\n🎫 **Lưu ý:** Nên đặt vé sớm để có giá tốt nhất và đảm bảo có chỗ.',
                timestamp: '2025-01-03T09:16:00.000Z',
            },
        ],
    },
    {
        id: 'chat_002',
        title: 'Hỏi về chính sách hủy vé',
        createdAt: '2025-01-03T14:30:00.000Z',
        updatedAt: '2025-01-03T14:45:00.000Z',
        status: 'resolved',
        messages: [
            {
                id: 'msg_007',
                role: 'user',
                content:
                    'Tôi đã đặt vé nhưng có việc đột xuất không thể đi được. Chính sách hủy vé như thế nào?',
                timestamp: '2025-01-03T14:30:00.000Z',
            },
            {
                id: 'msg_008',
                role: 'assistant',
                content:
                    'Tôi hiểu tình huống của anh/chị. Chính sách hủy vé của Vexere như sau:\n\n**📋 Chính sách hủy vé:**\n\n🕐 **Hủy trước 24h:**\n- Hoàn 70% giá vé\n- Phí xử lý: 30%\n\n🕐 **Hủy trước 12h:**\n- Hoàn 50% giá vé\n- Phí xử lý: 50%\n\n🕐 **Hủy trước 2h:**\n- Hoàn 20% giá vé\n- Phí xử lý: 80%\n\n❌ **Hủy trong 2h hoặc sau giờ khởi hành:**\n- Không hoàn tiền\n\n**Cách hủy vé:**\n1. Đăng nhập tài khoản Vexere\n2. Vào mục "Vé của tôi"\n3. Chọn "Hủy vé"\n4. Hoặc gọi hotline: 1900 888 684',
                timestamp: '2025-01-03T14:32:00.000Z',
            },
            {
                id: 'msg_009',
                role: 'user',
                content:
                    'Vé của tôi khởi hành lúc 8h sáng mai, giờ là 2h chiều hôm nay. Vậy tôi được hoàn bao nhiều?',
                timestamp: '2025-01-03T14:35:00.000Z',
            },
            {
                id: 'msg_010',
                role: 'assistant',
                content:
                    'Dựa vào thời gian anh/chị cung cấp:\n- Vé khởi hành: 8h sáng mai\n- Thời gian hiện tại: 2h chiều hôm nay\n- Khoảng cách: khoảng 18 tiếng\n\n✅ **Anh/chị được hoàn 70% giá vé** (hủy trước 24h)\n\n**Ví dụ:**\n- Giá vé: 300.000 VND\n- Số tiền hoàn: 210.000 VND\n- Phí xử lý: 90.000 VND\n\n**Thời gian hoàn tiền:** 3-7 ngày làm việc\n\nAnh/chị có muốn tôi hướng dẫn cách hủy vé không?',
                timestamp: '2025-01-03T14:37:00.000Z',
            },
            {
                id: 'msg_011',
                role: 'user',
                content: 'Được, bạn hướng dẫn tôi hủy vé qua app nhé',
                timestamp: '2025-01-03T14:40:00.000Z',
            },
            {
                id: 'msg_012',
                role: 'assistant',
                content:
                    '**📱 Hướng dẫn hủy vé qua App Vexere:**\n\n**Bước 1:** Mở app Vexere\n**Bước 2:** Đăng nhập tài khoản\n**Bước 3:** Chọn tab "Vé của tôi" ở menu dưới\n**Bước 4:** Tìm vé cần hủy và chọn "Chi tiết"\n**Bước 5:** Chọn "Hủy vé" màu đỏ\n**Bước 6:** Chọn lý do hủy vé\n**Bước 7:** Xác nhận hủy vé\n**Bước 8:** Chờ SMS/Email xác nhận\n\n⚠️ **Lưu ý:** Sau khi hủy không thể hoàn tác. Tiền sẽ được hoàn về tài khoản/thẻ thanh toán ban đầu.\n\nCó gì khó khăn anh/chị cứ liên hệ hotline nhé!',
                timestamp: '2025-01-03T14:42:00.000Z',
            },
            {
                id: 'msg_013',
                role: 'user',
                content: 'Cảm ơn bạn rất nhiều! Hướng dẫn rất chi tiết.',
                timestamp: '2025-01-03T14:45:00.000Z',
            },
        ],
    },
    {
        id: 'chat_003',
        title: 'Tư vấn tuyến Đà Nẵng - Hội An',
        createdAt: '2025-01-03T16:20:00.000Z',
        updatedAt: '2025-01-03T16:35:00.000Z',
        status: 'active',
        messages: [
            {
                id: 'msg_014',
                role: 'user',
                content: 'Từ Đà Nẵng đi Hội An có xe bus không? Giá bao nhiều?',
                timestamp: '2025-01-03T16:20:00.000Z',
            },
            {
                id: 'msg_015',
                role: 'assistant',
                content:
                    'Có nhiều lựa chọn để đi từ Đà Nẵng đến Hội An:\n\n🚌 **Xe bus công cộng:**\n- Tuyến số 01: Đà Nẵng - Hội An\n- Giá vé: 20.000 - 25.000 VND\n- Thời gian: 45-60 phút\n- Tần suất: 30 phút/chuyến\n\n🚐 **Xe khách tư nhân:**\n- Nhiều nhà xe: Hoàng Long, Sinh Tourist\n- Giá vé: 30.000 - 50.000 VND\n- Thời gian: 30-45 phút\n- Thoải mái hơn, có điều hòa\n\n🚕 **Taxi/Grab:**\n- Giá: 200.000 - 300.000 VND\n- Thời gian: 30-40 phút\n- Tiện lợi nhất\n\nAnh/chị muốn đi vào thời gian nào để tôi tư vấn cụ thể hơn?',
                timestamp: '2025-01-03T16:22:00.000Z',
            },
            {
                id: 'msg_016',
                role: 'user',
                content:
                    'Tôi muốn đi vào sáng mai, khoảng 9h. Xe nào tiện nhất?',
                timestamp: '2025-01-03T16:25:00.000Z',
            },
            {
                id: 'msg_017',
                role: 'assistant',
                content:
                    'Cho chuyến đi 9h sáng mai, tôi khuyên anh/chị:\n\n🌟 **Lựa chọn tốt nhất: Xe khách Hoàng Long**\n- Khởi hành: 9:00, 9:30, 10:00\n- Điểm đón: Bến xe Đà Nẵng (đường Điện Biên Phủ)\n- Điểm đến: Bến xe Hội An\n- Giá: 35.000 VND\n- Thời gian: 35 phút\n- Xe mới, có wifi, điều hòa\n\n📍 **Cách đặt vé:**\n- Mua trực tiếp tại bến xe\n- Hoặc đặt qua app Vexere\n- Hoặc gọi: 0236 3888 999\n\n⏰ **Lưu ý:** Nên đến bến xe trước 15 phút để kịp thủ tục.\n\nAnh/chị có cần địa chỉ cụ thể của bến xe không?',
                timestamp: '2025-01-03T16:28:00.000Z',
            },
        ],
    },
    {
        id: 'chat_004',
        title: 'Khiếu nại về chất lượng dịch vụ',
        createdAt: '2025-01-03T19:45:00.000Z',
        updatedAt: '2025-01-03T20:10:00.000Z',
        status: 'pending',
        messages: [
            {
                id: 'msg_018',
                role: 'user',
                content:
                    'Tôi rất không hài lòng với chuyến xe hôm qua. Xe đến muộn 2 tiếng, điều hòa hỏng, tài xế thái độ không tốt.',
                timestamp: '2025-01-03T19:45:00.000Z',
                attachments: [
                    {
                        type: 'image',
                        url: '/placeholder.svg?height=200&width=300',
                        name: 'xe_hong_dieu_hoa.jpg',
                    },
                ],
            },
            {
                id: 'msg_019',
                role: 'assistant',
                content:
                    'Tôi rất xin lỗi về trải nghiệm không tốt mà anh/chị đã gặp phải. Vexere cam kết mang đến dịch vụ chất lượng cao và chúng tôi sẽ xử lý vấn đề này một cách nghiêm túc.\n\n**Để hỗ trợ anh/chị tốt nhất, xin cung cấp:**\n\n📋 **Thông tin cần thiết:**\n- Mã vé hoặc mã chuyến\n- Ngày và giờ khởi hành\n- Tên nhà xe\n- Tuyến đường\n\n📸 **Hình ảnh:** Cảm ơn anh/chị đã gửi ảnh minh chứng\n\n**Chúng tôi sẽ:**\n1. Liên hệ nhà xe để làm rõ vấn đề\n2. Xem xét bồi thường phù hợp\n3. Cải thiện chất lượng dịch vụ\n\nAnh/chị có thể cung cấp mã vé để tôi tra cứu chi tiết không?',
                timestamp: '2025-01-03T19:48:00.000Z',
            },
            {
                id: 'msg_020',
                role: 'user',
                content:
                    'Mã vé của tôi là VXR123456789. Chuyến xe Phương Trang từ TP.HCM đi Cần Thơ lúc 14:00 ngày 02/01/2025.',
                timestamp: '2025-01-03T19:52:00.000Z',
            },
            {
                id: 'msg_021',
                role: 'assistant',
                content:
                    'Cảm ơn anh/chị đã cung cấp thông tin. Tôi đã ghi nhận:\n\n🎫 **Thông tin vé:**\n- Mã vé: VXR123456789\n- Nhà xe: Phương Trang\n- Tuyến: TP.HCM → Cần Thơ\n- Ngày: 02/01/2025, 14:00\n\n**Tôi đã chuyển khiếu nại đến bộ phận xử lý chuyên biệt:**\n\n✅ **Các bước tiếp theo:**\n1. Bộ phận CSKH sẽ liên hệ anh/chị trong 24h\n2. Xác minh thông tin với nhà xe Phương Trang\n3. Đưa ra phương án bồi thường phù hợp\n4. Báo cáo kết quả xử lý\n\n📞 **Mã khiếu nại:** KN2025010301\n\nAnh/chị vui lòng lưu mã này để theo dõi tiến độ xử lý. Chúng tôi sẽ liên hệ sớm nhất có thể!',
                timestamp: '2025-01-03T19:55:00.000Z',
            },
        ],
    },
    {
        id: 'chat_005',
        title: 'Hỏi về ưu đãi thành viên',
        createdAt: '2025-01-03T21:00:00.000Z',
        updatedAt: '2025-01-03T21:15:00.000Z',
        status: 'resolved',
        messages: [
            {
                id: 'msg_022',
                role: 'user',
                content:
                    'Vexere có chương trình ưu đãi cho khách hàng thân thiết không?',
                timestamp: '2025-01-03T21:00:00.000Z',
            },
            {
                id: 'msg_023',
                role: 'assistant',
                content:
                    'Có! Vexere có chương trình **VexereVIP** với nhiều ưu đãi hấp dẫn:\n\n🌟 **Hạng thành viên:**\n\n**🥉 Đồng (0-499k):**\n- Giảm 2% mỗi vé\n- Tích điểm x1\n- Hỗ trợ ưu tiên\n\n**🥈 Bạc (500k-1.999k):**\n- Giảm 5% mỗi vé\n- Tích điểm x1.5\n- Miễn phí đổi vé 1 lần/tháng\n- Voucher sinh nhật 50k\n\n**🥇 Vàng (2M-4.999M):**\n- Giảm 8% mỗi vé\n- Tích điểm x2\n- Miễn phí đổi vé không giới hạn\n- Voucher sinh nhật 100k\n- Ưu tiên chọn ghế\n\n**💎 Kim cương (5M+):**\n- Giảm 12% mỗi vé\n- Tích điểm x3\n- Tất cả quyền lợi hạng Vàng\n- Voucher sinh nhật 200k\n- Hotline riêng 24/7\n\nAnh/chị muốn đăng ký thành viên không?',
                timestamp: '2025-01-03T21:03:00.000Z',
            },
            {
                id: 'msg_024',
                role: 'user',
                content: 'Làm sao để đăng ký? Có mất phí không?',
                timestamp: '2025-01-03T21:08:00.000Z',
            },
            {
                id: 'msg_025',
                role: 'assistant',
                content:
                    '**🆓 Hoàn toàn MIỄN PHÍ!**\n\n**Cách đăng ký VexereVIP:**\n\n📱 **Qua App/Website:**\n1. Tải app Vexere hoặc vào vexere.com\n2. Đăng ký tài khoản (nếu chưa có)\n3. Vào mục "Tài khoản" → "VexereVIP"\n4. Điền thông tin cá nhân\n5. Xác thực OTP\n6. Hoàn tất!\n\n🎁 **Ưu đãi chào mừng:**\n- Voucher 50k cho lần đặt vé đầu tiên\n- Tặng 100 điểm khởi đầu\n- Miễn phí nâng cấp lên hạng Đồng\n\n**Hạng thành viên được tính theo:**\n- Tổng giá trị vé đã mua trong 12 tháng\n- Tự động nâng hạng khi đủ điều kiện\n- Điểm tích lũy không bao giờ hết hạn\n\nAnh/chị có muốn tôi hướng dẫn chi tiết từng bước không?',
                timestamp: '2025-01-03T21:12:00.000Z',
            },
            {
                id: 'msg_026',
                role: 'user',
                content: 'Cảm ơn! Tôi sẽ đăng ký ngay. Thông tin rất hữu ích.',
                timestamp: '2025-01-03T21:15:00.000Z',
            },
        ],
    },
];
