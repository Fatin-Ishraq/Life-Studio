'use client';

import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebar-collapsed');
            return saved === 'true';
        }
        return false;
    });

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    useEffect(() => {
        if (!loading && !firebaseUser) {
            router.push('/login');
        }
    }, [firebaseUser, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-neutral-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!firebaseUser) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
            <main
                className={cn(
                    "flex-1 overflow-y-auto transition-all duration-300 custom-scrollbar",
                    isCollapsed ? "ml-20" : "ml-72"
                )}
            >
                {children}
            </main>
        </div>
    );
}
