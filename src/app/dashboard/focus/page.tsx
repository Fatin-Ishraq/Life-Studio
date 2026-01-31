'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getActiveProjects } from '@/lib/supabase/projectService';
import { getTodayFocusStats, getRecentSessionsWithProjects } from '@/lib/supabase/sessionService';
import { FocusTimer } from '@/components/panels/FocusTimer';
import { Flame, Clock, Zap, Timer, Coffee, Target, ChevronDown, TrendingUp, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/database';

const MOTIVATIONAL_QUOTES = [
    "The secret of getting ahead is getting started.",
    "Focus on being productive instead of busy.",
    "It's not about having time, it's about making time.",
    "Deep work is the superpower of the 21st century.",
    "Your focus determines your reality.",
    "Small steps every day lead to big results.",
    "Consistency beats intensity.",
];

interface TodayStats {
    sessionsToday: number;
    minutesToday: number;
    streak: number;
}

interface RecentSession {
    id: string;
    session_type: string;
    duration_minutes: number;
    started_at: string;
    project_name: string | null;
    project_color: string | null;
}

export default function FocusPage() {
    const { supabaseUser } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [todayStats, setTodayStats] = useState<TodayStats>({ sessionsToday: 0, minutesToday: 0, streak: 0 });
    const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    const loadData = useCallback(async () => {
        if (!supabaseUser) return;

        try {
            const [projectsData, statsData, sessionsData] = await Promise.all([
                getActiveProjects(supabaseUser.id),
                getTodayFocusStats(supabaseUser.id),
                getRecentSessionsWithProjects(supabaseUser.id, 5)
            ]);

            setProjects(projectsData);
            setTodayStats(statsData);
            setRecentSessions(sessionsData);
        } catch (error) {
            console.error('Error loading focus data:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSessionComplete = () => {
        loadData();
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const getSessionIcon = (type: string) => {
        switch (type) {
            case 'pomodoro': return Timer;
            case 'deep_work': return Zap;
            case 'break': return Coffee;
            default: return Clock;
        }
    };

    const getSessionConfig = (type: string) => {
        switch (type) {
            case 'pomodoro': return {
                color: 'text-orange-500',
                bg: 'bg-orange-50 dark:bg-orange-900/20',
                gradient: 'from-orange-500/20 to-rose-500/10'
            };
            case 'deep_work': return {
                color: 'text-violet-500',
                bg: 'bg-violet-50 dark:bg-violet-900/20',
                gradient: 'from-violet-500/20 to-purple-500/10'
            };
            case 'break': return {
                color: 'text-emerald-500',
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                gradient: 'from-emerald-500/20 to-green-500/10'
            };
            default: return {
                color: 'text-blue-500',
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                gradient: 'from-blue-500/20 to-cyan-500/10'
            };
        }
    };

    const dailyGoalPercent = Math.min(100, Math.round((todayStats.minutesToday / 120) * 100));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-200 dark:border-neutral-800" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Header */}
            <div className="p-4 md:p-8 pb-0">
                <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/30 to-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 animate-pulse-slow" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                    <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-br from-rose-500/10 to-orange-500/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10 p-8 md:p-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
                                        <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600/70 dark:text-violet-400/70">Focus Zone</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                                    Time to Focus
                                </h1>
                                <p className="text-lg text-neutral-600 dark:text-neutral-400 italic font-medium max-w-lg">
                                    &ldquo;{quote}&rdquo;
                                </p>
                            </div>

                            {/* Compact Stats */}
                            <div className="flex items-center gap-4">
                                <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl flex items-center gap-3 hover:scale-105 transition-transform">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        todayStats.streak > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-neutral-100 dark:bg-neutral-800"
                                    )}>
                                        <Flame className={cn(
                                            "w-5 h-5",
                                            todayStats.streak > 0 ? "text-amber-500 animate-flicker" : "text-neutral-400"
                                        )} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Streak</div>
                                        <div className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">{todayStats.streak}d</div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-violet-600 to-purple-600 p-4 rounded-2xl shadow-xl shadow-violet-500/20 flex items-center gap-3 text-white hover:scale-105 transition-transform">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-violet-200">Today</div>
                                        <div className="text-xl font-black tabular-nums">{formatDuration(todayStats.minutesToday)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto p-4 md:p-8 pt-6">
                {/* Timer Section - Takes Full Height */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Selector */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl hover:shadow-2xl transition-shadow">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">Link to Project</label>
                        <div className="relative group">
                            <select
                                value={selectedProjectId || ''}
                                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                                title="Select a project to link this session"
                                className="w-full appearance-none px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 pr-12 cursor-pointer transition-all group-hover:border-violet-300 dark:group-hover:border-violet-700"
                            >
                                <option value="">No project (General focus)</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none group-hover:text-violet-500 transition-colors" />
                        </div>
                    </div>

                    {/* Timer Component */}
                    <FocusTimer
                        onComplete={handleSessionComplete}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Daily Goal with Ring */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                                <TrendingUp className="w-5 h-5 text-violet-500" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400">Daily Goal</h2>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Progress Ring */}
                            <div className="relative w-24 h-24">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-neutral-100 dark:text-neutral-800"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="url(#goalGradient)"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 40}
                                        strokeDashoffset={2 * Math.PI * 40 * (1 - dailyGoalPercent / 100)}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                    <defs>
                                        <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#a855f7" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-neutral-900 dark:text-white">{dailyGoalPercent}%</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-sm font-bold text-neutral-500">
                                    {formatDuration(todayStats.minutesToday)} of 2h
                                </p>
                                <p className="text-[10px] text-neutral-400 mt-1">
                                    {todayStats.sessionsToday} session{todayStats.sessionsToday !== 1 ? 's' : ''} completed
                                </p>
                                {dailyGoalPercent >= 100 && (
                                    <div className="flex items-center gap-1.5 mt-2 text-emerald-500">
                                        <Sparkles className="w-4 h-4 animate-pulse" />
                                        <span className="text-xs font-bold">Goal achieved!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Today's Stats */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                <BarChart3 className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400">Today&apos;s Stats</h2>
                        </div>

                        <div className="space-y-4">
                            <StatRow
                                icon={Flame}
                                label="Sessions"
                                value={todayStats.sessionsToday.toString()}
                                color="text-orange-500 bg-orange-50 dark:bg-orange-900/20"
                            />
                            <StatRow
                                icon={Clock}
                                label="Focus Time"
                                value={formatDuration(todayStats.minutesToday)}
                                color="text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            />
                            <StatRow
                                icon={Zap}
                                label="Streak"
                                value={`${todayStats.streak} day${todayStats.streak !== 1 ? 's' : ''}`}
                                color="text-violet-500 bg-violet-50 dark:bg-violet-900/20"
                            />
                        </div>
                    </div>

                    {/* Recent Sessions Timeline */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
                        <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Recent Sessions</h2>

                        {recentSessions.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3 animate-bounce-slow">
                                    <Timer className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                                </div>
                                <p className="text-sm font-medium text-neutral-500">No sessions yet</p>
                                <p className="text-[10px] text-neutral-400">Start your first focus session!</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-neutral-100 dark:bg-neutral-800" />

                                <div className="space-y-4">
                                    {recentSessions.map((session, index) => {
                                        const Icon = getSessionIcon(session.session_type);
                                        const config = getSessionConfig(session.session_type);
                                        return (
                                            <div
                                                key={session.id}
                                                className="relative flex items-start gap-4 pl-1 group animate-slide-in"
                                                style={{ animationDelay: `${index * 0.1}s` }}
                                            >
                                                {/* Timeline dot */}
                                                <div className={cn(
                                                    "relative z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                                                    config.bg
                                                )}>
                                                    <Icon className={cn("w-4 h-4", config.color)} />
                                                </div>

                                                {/* Content */}
                                                <div className={cn(
                                                    "flex-1 p-3 rounded-2xl transition-all group-hover:shadow-md",
                                                    `bg-gradient-to-br ${config.gradient}`
                                                )}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={cn("text-sm font-bold capitalize", config.color)}>
                                                            {session.session_type.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-neutral-400">
                                                            {formatTimeAgo(session.started_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-neutral-500 truncate">
                                                        {session.project_name || 'General'} • {session.duration_minutes}m
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Global CSS */}
            <style jsx global>{`
                @keyframes flicker {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    25% { opacity: 0.8; transform: scale(0.95); }
                    50% { opacity: 1; transform: scale(1.05); }
                    75% { opacity: 0.9; transform: scale(0.98); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.05); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-flicker { animation: flicker 1s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
                .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
                .animate-slide-in { animation: slide-in 0.4s ease-out backwards; }
            `}</style>
        </div>
    );
}

function StatRow({ icon: Icon, label, value, color }: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", color)}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
                <p className="text-xl font-black text-neutral-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}
