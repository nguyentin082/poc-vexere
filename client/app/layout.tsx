import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Vexere - Đặt vé xe khách trực tuyến',
    description:
        'Nền tảng đặt vé xe khách hàng đầu Việt Nam với trợ lý AI thông minh',
    generator: 'v0.dev',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body className={inter.className} suppressHydrationWarning={true}>
                {children}
            </body>
        </html>
    );
}
