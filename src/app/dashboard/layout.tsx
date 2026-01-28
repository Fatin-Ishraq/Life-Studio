'use client';

import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();

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
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
