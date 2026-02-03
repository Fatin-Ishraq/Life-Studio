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
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { signOut } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Focus', href: '/dashboard/focus', icon: Timer },
    { name: 'Habits', href: '/dashboard/habits', icon: CheckSquare },
    { name: 'Reading', href: '/dashboard/reading', icon: BookOpen },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { firebaseUser } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 288 }}
            className={cn(
                "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 backdrop-blur-xl border-r",
                "bg-(--sidebar-bg) border-(--sidebar-border)",
                isCollapsed ? "p-4" : "p-6"
            )}
        >
            {/* Collapse Toggle Button */}
            <button
                onClick={onToggle}
                className={cn(
                    "absolute -right-3 top-10 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white shadow-lg transition-all z-50",
                    isCollapsed && "rotate-180"
                )}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Logo Section */}
            <div className={cn(
                "flex items-center gap-3 mb-10 transition-all duration-300",
                isCollapsed ? "justify-center" : "px-2"
            )}>
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                    <Zap className="h-5 w-5 text-white dark:text-neutral-900" />
                </div>
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            key="logo-text"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <h1 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                                Life Studio
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">System Active</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                {!isCollapsed && (
                    <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest px-4 mb-4">
                        Workspace
                    </p>
                )}
                {navigation.map((item) => {
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center rounded-2xl transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700',
                                isCollapsed ? 'p-3 justify-center' : 'px-4 py-3.5 justify-between',
                                isActive
                                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xl'
                                    : 'text-(--sidebar-text) hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-(--sidebar-text-active)'
                            )}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <div className="flex items-center gap-3 relative z-10 min-w-0">
                                <item.icon className={cn(
                                    "h-5 w-5 transition-transform duration-300 flex-shrink-0",
                                    !isCollapsed && "group-hover:scale-110",
                                    isActive ? "text-inherit" : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
                                )} />
                                {!isCollapsed && (
                                    <span className="text-sm font-bold tracking-tight truncate">{item.name}</span>
                                )}
                            </div>
                            {!isCollapsed && isActive && (
                                <ChevronRight className="h-4 w-4 opacity-50 relative z-10 flex-shrink-0" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User & Settings Section */}
            <div className="mt-auto pt-6 space-y-4">
                {/* User Card */}
                <div className={cn(
                    "rounded-[24px] bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 transition-all duration-300",
                    isCollapsed ? "p-2" : "p-4"
                )}>
                    <div className={cn(
                        "flex items-center transition-all duration-300",
                        isCollapsed ? "justify-center mb-2" : "gap-3 mb-4"
                    )}>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-900 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-900 dark:text-white text-sm font-black shadow-inner flex-shrink-0">
                            {firebaseUser?.displayName?.[0] || firebaseUser?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.div
                                    key="user-info"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex-1 min-w-0"
                                >
                                    <p className="text-sm font-black text-neutral-900 dark:text-white truncate">
                                        {firebaseUser?.displayName || 'Active Member'}
                                    </p>
                                    <p className="text-[10px] font-bold text-neutral-500 truncate tracking-wide">
                                        {firebaseUser?.email}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className={cn(
                        "flex transition-all duration-300",
                        isCollapsed ? "flex-col gap-1" : "gap-2"
                    )}>
                        {!isCollapsed && (
                            <Link
                                href="/dashboard/settings"
                                className="flex-1 flex items-center justify-center p-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white border border-neutral-100 dark:border-neutral-700 transition-all shadow-sm"
                                title="Settings"
                            >
                                <Settings className="h-4 w-4" />
                            </Link>
                        )}
                        <button
                            onClick={handleSignOut}
                            className={cn(
                                "flex-1 flex items-center justify-center p-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border border-neutral-100 dark:border-neutral-700 transition-all shadow-sm",
                                isCollapsed && "hover:bg-red-50"
                            )}
                            title="Sign Out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Footer Tag */}
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            key="footer-version"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-600">
                                Life Studio v1.0
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.aside>
    );
}
