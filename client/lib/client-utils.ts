import { useEffect, useState } from 'react';

// Custom hook to handle client-side only rendering
export const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};

// Safe date formatting to avoid hydration issues
export const formatDateSafe = (dateStr: string, timeStr: string) => {
    // Fallback format for SSR
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${day}/${month}/${year} - ${timeStr}`;
};

// Client-side date formatting (for when we want locale-specific formatting)
export const formatDateClient = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('vi-VN')} - ${timeStr}`;
};
