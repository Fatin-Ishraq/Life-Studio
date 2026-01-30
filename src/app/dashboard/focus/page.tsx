'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getActiveProjects } from '@/lib/supabase/projectService';
import { getTodayFocusStats, getRecentSessionsWithProjects } from '@/lib/supabase/sessionService';
import { FocusTimer } from '@/components/panels/FocusTimer';
import { Flame, Clock, Zap, Timer, Coffee, Target, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/database';

const MOTIVATIONAL_QUOTES = [
    "The secret of getting ahead is getting started.",
    "Focus on being productive instead of busy.",
    "It's not about having time, it's about making time.",
    "Deep work is the superpower of the 21st century.",
    "Your focus determines your reality.",
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
        // Refresh stats after session completes
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

    const getSessionColor = (type: string) => {
        switch (type) {
            case 'pomodoro': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
            case 'deep_work': return 'text-violet-500 bg-violet-50 dark:bg-violet-900/20';
            case 'break': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
            default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
        }
    };

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
        <div className="min-h-screen p-4 md:p-8 pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl mb-8">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/30 to-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10 p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
                            <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600/70 dark:text-violet-400/70">Focus Zone</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight mb-3">
                        Time to Focus
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 italic font-medium max-w-lg">
                        &ldquo;{quote}&rdquo;
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {/* Timer Section - Takes Full Height */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Selector */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">Link to Project</label>
                        <div className="relative">
                            <select
                                value={selectedProjectId || ''}
                                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                                title="Select a project to link this session"
                                className="w-full appearance-none px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 pr-12 cursor-pointer"
                            >
                                <option value="">No project (General focus)</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Timer Component */}
                    <FocusTimer
                        onComplete={handleSessionComplete}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Today's Stats */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
                        <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-6">Today&apos;s Progress</h2>

                        <div className="space-y-5">
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

                        {/* Daily Goal Progress */}
                        <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Daily Goal</span>
                                <span className="text-sm font-bold text-neutral-900 dark:text-white">{Math.min(100, Math.round((todayStats.minutesToday / 120) * 100))}%</span>
                            </div>
                            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (todayStats.minutesToday / 120) * 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-2">Goal: 2 hours of focus time</p>
                        </div>
                    </div>

                    {/* Recent Sessions */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
                        <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Recent Sessions</h2>

                        {recentSessions.length === 0 ? (
                            <div className="text-center py-8">
                                <Timer className="w-10 h-10 text-neutral-200 dark:text-neutral-700 mx-auto mb-3" />
                                <p className="text-sm text-neutral-500">No sessions yet</p>
                                <p className="text-[10px] text-neutral-400">Start your first focus session!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentSessions.map((session) => {
                                    const Icon = getSessionIcon(session.session_type);
                                    return (
                                        <div
                                            key={session.id}
                                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <div className={cn("p-2 rounded-xl", getSessionColor(session.session_type))}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-neutral-900 dark:text-white capitalize">
                                                    {session.session_type.replace('_', ' ')}
                                                </p>
                                                <p className="text-[10px] text-neutral-400 truncate">
                                                    {session.project_name || 'General'} • {session.duration_minutes}m
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-bold text-neutral-400 whitespace-nowrap">
                                                {formatTimeAgo(session.started_at)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
        <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", color)}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
                <p className="text-xl font-black text-neutral-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}
