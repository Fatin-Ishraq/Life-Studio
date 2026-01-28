'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FolderKanban,
    Timer,
    CheckSquare,
    BookOpen,
    BarChart3,
    Settings,
    LogOut,
    Zap,
    ChevronRight
} from 'lucide-react';
import { signOut } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Focus', href: '/focus', icon: Timer },
    { name: 'Habits', href: '/habits', icon: CheckSquare },
    { name: 'Reading', href: '/reading', icon: BookOpen },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();
    const { firebaseUser } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-gradient-to-b from-neutral-50 to-white border-r border-neutral-100 p-6 flex flex-col">
            {/* Logo Section */}
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center shadow-lg shadow-neutral-200">
                    <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                        Life Cockpit
                    </h1>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">System Active</span>
                    </div>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 space-y-2">
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest px-4 mb-4">
                    Workspace
                </p>
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-300 relative overflow-hidden',
                                isActive
                                    ? 'bg-neutral-900 text-white shadow-xl shadow-neutral-200 translate-x-1'
                                    : 'text-neutral-500 hover:bg-white hover:text-neutral-900 hover:translate-x-1 hover:shadow-md hover:shadow-neutral-100'
                            )}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <item.icon className={cn(
                                    "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-900"
                                )} />
                                <span className="text-sm font-bold tracking-tight">{item.name}</span>
                            </div>
                            {isActive && (
                                <ChevronRight className="h-4 w-4 text-white/50 relative z-10" />
                            )}
                            {/* Hover Backdrop for inactive items */}
                            {!isActive && (
                                <div className="absolute inset-0 bg-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User & Settings Section */}
            <div className="mt-auto space-y-6">
                {/* User Card */}
                <div className="p-4 rounded-[24px] bg-white border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200 flex items-center justify-center text-neutral-600 text-sm font-black shadow-inner">
                            {firebaseUser?.displayName?.[0] || firebaseUser?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-neutral-900 truncate">
                                {firebaseUser?.displayName || 'Active Member'}
                            </p>
                            <p className="text-[10px] font-bold text-neutral-400 truncate tracking-wide">
                                {firebaseUser?.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href="/settings"
                            className="flex-1 flex items-center justify-center p-2 rounded-xl bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
                            title="Settings"
                        >
                            <Settings className="h-4 w-4" />
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="flex-1 flex items-center justify-center p-2 rounded-xl bg-neutral-50 text-neutral-500 hover:bg-red-50 hover:text-red-500 transition-all"
                            title="Sign Out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Footer Tag */}
                <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-300">
                        V0.4.0 High-End
                    </p>
                </div>
            </div>
        </aside>
    );
}
